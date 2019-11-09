import * as kleur from "kleur";
import { hashObject } from "../../interface";
import { EventPacket } from "../pubsub";
import { Service } from "./index";

export type ServiceEventProps = {
  service: Service;
  id: string;
  displayName: string;
  group: string;
  description: string | null;
  deprecated: boolean;
  meta: object | null;
};
type EventExample = EventPacket & { hash?: string };

export class ServiceEvent {
  private readonly examples: EventExample[] = [];

  constructor(protected readonly props: ServiceEventProps) {
  }

  public get service(): Readonly<Service> {
    return this.props.service;
  }

  public get id(): string {
    return this.props.id;
  }

  public get displayName(): string {
    return this.props.displayName;
  }

  public get group(): string {
    return this.props.group;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get deprecated(): boolean {
    return this.props.deprecated;
  }

  public get meta(): Readonly<object> | null {
    return this.props.meta;
  }

  public addExample(example: EventExample, limit: number): void {
    example.hash = hashObject(example);
    if (this.examples.some(eg => eg.hash === example.hash)) {
      return;
    }
    this.examples.unshift(example);
    this.examples.splice(limit);
  }

  public getExamples(limit?: number) {
    return this.examples.slice(0, limit);
  }

  public toString(): string {
    return kleur.green(this.props.id);
  }
}
