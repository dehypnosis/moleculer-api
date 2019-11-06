import * as http from "http";
import * as http2 from "http2";
import { Pluggable } from "../../../interface";
import { Logger } from "../../../logger";

export type ContextFactorySource = Readonly<http.IncomingMessage | http2.Http2ServerRequest>;

export type ContextFactoryProps = {
  logger: Logger;
};

export type ContextFactoryFn = (source: ContextFactorySource) => Promise<any>;

export abstract class ContextFactory<T> extends Pluggable {
  constructor(protected readonly props: ContextFactoryProps, opts?: any) {
    super();
  }

  private static contextParsedSymbol = Symbol("contextParsed");

  public static merge(factories: ReadonlyArray<ContextFactory<any>>, hooks?: { before?: (source: ContextFactorySource) => void, after?: (source: ContextFactorySource, context: any) => void }): ContextFactoryFn {
    return async source => {
      // mark source as parsed
      console.assert(!source.hasOwnProperty(ContextFactory.contextParsedSymbol), "cannot call context factory more than once from a request: check ApplicationComponent.unmountRoutes/mountRoutes methods");
      Object.defineProperty(source, ContextFactory.contextParsedSymbol, {value: true});

      if (hooks && hooks.before) {
        hooks.before(source);
      }

      const context: { [key: string]: any } = {};
      const entries = await Promise.all(factories.map(async factory => [factory.key, await factory.create(source)] as [string, any]));
      for (const [k, v] of entries) {
        context[k] = v;
      }

      if (hooks && hooks.after) {
        hooks.after(source, context);
      }

      return context;
    };
  }

  public static parsed(source: ContextFactorySource): boolean {
    return source.hasOwnProperty(ContextFactory.contextParsedSymbol);
  }

  public abstract create(source: ContextFactorySource): Promise<T> | T;
}
