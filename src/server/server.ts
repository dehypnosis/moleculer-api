import * as kleur from "kleur";
import _ from "lodash";
import { RecursivePartial } from "../interface";
import { Logger } from "../logger";
import { SchemaRegistry } from "../schema";
import { ServerApplication, ServerApplicationOptions, APIRequestContextFactoryConstructors, APIRequestContextFactoryConstructorOptions, defaultAPIRequestContextFactoryConstructorOptions, APIRequestContextFactory } from "./application";
import { ServerMiddlewareConstructorOptions, defaultServerMiddlewareConstructorOptions, ServerMiddlewareConstructors } from "./middleware";
import { ServerProtocol, ServerProtocolConstructorOptions, defaultServerProtocolConstructorOptions, ServerProtocolConstructors } from "./protocol";

export type APIServerProps = {
  schema: SchemaRegistry;
  logger: Logger;
};

export type APIServerUpdateOptions = {
  debouncedSeconds: number;
  maxDebouncedSeconds: number;
};

export type APIServerOptions = {
  update: APIServerUpdateOptions;
  application: ServerApplicationOptions;
  middleware: ServerMiddlewareConstructorOptions;
  protocol: ServerProtocolConstructorOptions;
  context: APIRequestContextFactoryConstructorOptions;
};

export class APIServer {
  private readonly opts: APIServerOptions;
  private readonly app: ServerApplication;
  private readonly protocols: ServerProtocol[];

  constructor(private props: APIServerProps, opts?: RecursivePartial<APIServerOptions>) {
    // adjust options
    this.opts = _.defaultsDeep(opts || {}, {
      update: {
        debouncedSeconds: 2,
        maxDebouncedSeconds: 5,
      },
      application: {},
      context: defaultAPIRequestContextFactoryConstructorOptions,
      middleware: {},
      protocol: defaultServerProtocolConstructorOptions,
    });
    this.opts.update.debouncedSeconds = isNaN(this.opts.update.debouncedSeconds) ? 2 : Math.max(this.opts.update.debouncedSeconds, 0);
    this.opts.update.maxDebouncedSeconds = isNaN(this.opts.update.maxDebouncedSeconds) ? 5 : Math.max(this.opts.update.maxDebouncedSeconds, this.opts.update.debouncedSeconds, 1);

    // create context factory
    const contextFactories = Object.entries(this.opts.context)
      .reduce((factories, [k, options]) => {
        const key = k as keyof APIRequestContextFactoryConstructorOptions;
        if (options !== false) {
          factories.push(
            new (APIRequestContextFactoryConstructors[key])({
              logger: this.props.logger.getChild(`context/${key}`),
            }, options),
          );
        }
        return factories;
      }, [] as Array<APIRequestContextFactory<any>>);
    this.props.logger.info(`gateway context factories have been applied ${contextFactories.join(", ")}`);

    // create application
    this.app = new ServerApplication({
      logger: this.props.logger.getChild(`application`),
      contextFactories,
    }, this.opts.application);

    // override middleware options
    const middlewareKeyAndOptions: Array<[keyof ServerMiddlewareConstructorOptions, any]> = [];
    for (const [k, defaultOptions] of Object.entries(defaultServerMiddlewareConstructorOptions)) {
      const key = k as keyof ServerMiddlewareConstructorOptions;
      const overriding = this.opts.middleware[key];
      if (typeof overriding !== "undefined") {
        middlewareKeyAndOptions.push([key, overriding ? _.defaultsDeep(overriding, defaultOptions) : overriding]);
      } else {
        middlewareKeyAndOptions.push([key, defaultOptions]);
      }
    }

    // create middleware
    const middleware = middlewareKeyAndOptions
      .filter(([key, options]) => options !== false)
      .map(([key, options]) => {
        return new (ServerMiddlewareConstructors[key])({
          logger: this.props.logger.getChild(`middleware/${key}`),
        }, options);
      });

    // apply application middleware
    for (const middle of middleware) {
      middle.apply(this.app.componentModules);
    }
    this.props.logger.info(`gateway server middleware have been applied: ${middleware.join(", ")}`);

    // create protocol
    this.protocols = Object.entries(this.opts.protocol)
      .reduce((protocols, [k, options]) => {
        const key = k as keyof ServerProtocolConstructorOptions;
        if (options !== false) {
          protocols.push(
            new (ServerProtocolConstructors[key])({
              logger: this.props.logger.getChild(`protocol/${key}`),
            }, options),
          );
        }
        return protocols;
      }, [] as ServerProtocol[]);
  }

  /* lifecycle */
  public async start() {
    // start application
    await this.app.start();

    // make server protocol listen
    const listeningURIs: string[] = [];
    for (const protocol of this.protocols) {
      listeningURIs.push(...(await protocol.start(this.app.componentModules)));
    }
    this.props.logger.info(`gateway server protocol has been started: ${this.protocols.join(", ")}`);

    if (listeningURIs.length > 0) {
      this.props.logger.info(`gateway server has been started and listening on: ${kleur.blue(kleur.bold(listeningURIs.join(", ")))}`);
    } else {
      this.props.logger.error(`gateway server has been started but there are ${kleur.red("no bound network interfaces")}`);
    }

    // start schema registry and connect handler update methods
    await this.props.schema.start({
      // update handler is debounced for performance's sake
      updated: _.debounce(this.app.mountBranchHandler.bind(this.app), 1000 * this.opts.update.debouncedSeconds, {maxWait: 1000 * this.opts.update.maxDebouncedSeconds}),
      removed: this.app.unmountBranchHandler.bind(this.app),
    });
  }

  public async stop() {
    // stop application
    await this.app.stop();

    for (const protocol of this.protocols) {
      await protocol.stop();
      this.props.logger.info(`gateway server protocol has been stopped: ${protocol}`);
    }
    this.props.logger.info(`gateway server has been stopped`);

    // stop schema registry
    await this.props.schema.stop();
  }
}
