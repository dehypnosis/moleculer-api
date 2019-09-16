import * as _ from "lodash";
import { RecursivePartial, sanitizeObject } from "../../interface";
import { Logger } from "../../logger";
import { EventPacket } from "../pubsub";
import { Service, ServiceAction } from "./index";

export type ServiceRegistryProps = {
  logger: Logger;
};

export type ServiceRegistryOptions = {
  examples: {
    processIntervalSeconds: number;
    queueLimit: number;
    limitPerActions: number;
    limitPerEvents: number;
    streamNotation: string,
    omittedNotation: string,
    omittedLimit: number,
    redactedNotation: string,
    redactedParamNameRegExps: RegExp[];
  };
  healthCheck: {
    intervalSeconds: number;
  };
};

export class ServiceRegistry {
  private readonly actionExamplesQueue: Array<{ serviceHash: string, actionId: string, params: any, response: any }> = [];
  private readonly eventExamplesQueue: Array<{ events: string[], packet: EventPacket }> = [];
  private readonly serviceHashMap = new Map<string, Readonly<Service>>();
  private readonly opts: ServiceRegistryOptions;

  constructor(protected readonly props: ServiceRegistryProps, opts?: RecursivePartial<ServiceRegistryOptions>) {
    this.opts = _.defaultsDeep(opts || {}, {
      examples: {
        processIntervalSeconds: 5,
        queueLimit: 50,
        limitPerActions: 10,
        limitPerEvents: 10,
        streamNotation: "*STREAM*",
        omittedNotation: "*OMITTED*",
        omittedLimit: 100,
        redactedNotation: "*REDACTED*",
        redactedParamNameRegExps: [
          /password/i,
          /secret/i,
          /credential/i,
          /key/i,
          /token/i,
        ],
      },
      healthCheck: {
        intervalSeconds: 10,
      },
    });
  }

  public addService(service: Readonly<Service>): void {
    this.serviceHashMap.set(service.hash, service);
  }

  public removeServiceByHash(hash: string): boolean {
    return this.serviceHashMap.delete(hash);
  }

  public findServiceByHash(hash: string): Readonly<Service> | null {
    return this.serviceHashMap.get(hash) || null;
  }

  public get services(): Array<Readonly<Service>> {
    return Array.from(this.serviceHashMap.values());
  }

  public addActionExample(args: { action: Readonly<ServiceAction>, params: any, response: any }): void {
    if (this.actionExamplesQueue.length > this.opts.examples.queueLimit) {
      return;
    }
    const {params, response} = args;
    this.actionExamplesQueue.push({serviceHash: args.action.service.hash, actionId: args.action.id, params, response});
  }

  public addEventExample(events: string[], packet: EventPacket): void {
    if (this.eventExamplesQueue.length > this.opts.examples.queueLimit) {
      return;
    }
    this.eventExamplesQueue.push({events, packet});
  }

  private consumeExamplesQueues(): void {
    const actionExamples = this.actionExamplesQueue.splice(0);
    const eventExamples = this.eventExamplesQueue.splice(0);

    for (const {serviceHash, actionId, params, response} of actionExamples) {
      const example = {params: this.sanitizeObject(params), response: this.sanitizeObject(response)};
      const service = this.serviceHashMap.get(serviceHash);
      if (service) {
        for (const [id, act] of service.actionMap) {
          if (id === actionId) {
            act.addExample(example, this.opts.examples.limitPerActions);
            return;
          }
        }
      }
    }

    for (const {events, packet} of eventExamples) {
      const example = {...packet, params: this.sanitizeObject(packet.params)};
      for (const svc of this.serviceHashMap.values()) {
        for (const evt of svc.subscribedEvents) {
          if (events.includes(evt.id) && (example.groups == null || example.groups.includes(evt.group))) {
            evt.addExample(example, this.opts.examples.limitPerEvents);
          }
        }
      }
    }
  }

  private sanitizeObject(obj: any): any {
    const opts = this.opts.examples;
    return sanitizeObject(obj, {
      redactedObjectKeyRegExps: opts.redactedParamNameRegExps,
      redactedNotation: opts.redactedNotation,
      omittedLimit: opts.omittedLimit,
      omittedNotation: opts.omittedNotation,
      streamNotation: opts.streamNotation,
    });
  }

  private healthChecking = false;

  private async healthCheck(): Promise<void> {
    if (this.healthChecking) {
      return;
    }
    this.healthChecking = true;
    try {
      await Promise.all(this.services.map(service => service.healthCheck()));
    } catch (error) {
      this.props.logger.error(error);
    } finally {
      this.healthChecking = false;
    }
  }

  private healthCheckIntervalTimer?: NodeJS.Timeout;
  private consumeExamplesIntervalTimer?: NodeJS.Timeout;

  public async start(): Promise<void> {
    this.consumeExamplesIntervalTimer = setInterval(() => this.consumeExamplesQueues(), this.opts.examples.processIntervalSeconds * 1000);
    this.healthCheckIntervalTimer = setInterval(() => this.healthCheck(), this.opts.healthCheck.intervalSeconds * 1000);
    return;
  }

  public async stop(): Promise<void> {
    this.actionExamplesQueue.splice(0);
    this.eventExamplesQueue.splice(0);
    this.serviceHashMap.clear();
    if (this.consumeExamplesIntervalTimer) {
      clearInterval(this.consumeExamplesIntervalTimer);
      delete this.consumeExamplesIntervalTimer;
    }
    if (this.healthCheckIntervalTimer) {
      clearInterval(this.healthCheckIntervalTimer);
      delete this.healthCheckIntervalTimer;
    }
    return;
  }
}
