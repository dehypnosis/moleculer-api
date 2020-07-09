import * as kleur from "kleur";
import { normalizeValidationSchema, NormalizedValidationSchema, hashObject } from "../../interface";
import { Service } from "./index";

export type ServiceActionCachePolicy = { ttl: number, [key: string]: any };

export type ServiceActionProps = {
  service: Service;
  id: string;
  displayName: string;
  description: string | null;
  deprecated: boolean;
  paramsSchema: NormalizedValidationSchema | null;
  cachePolicy: ServiceActionCachePolicy | null;
  meta: object | null;
};

export type ActionExample = { params: any, response: any, hash?: string };

export class ServiceAction {
  private readonly examples: ActionExample[] = [];
  public readonly paramsSchema: Readonly<NormalizedValidationSchema> | null = null;

  constructor(protected readonly props: ServiceActionProps) {
    if (this.props.paramsSchema) {
      this.paramsSchema = normalizeValidationSchema(this.props.paramsSchema);
    }
  }

  public getInformation(includeExamples = false) {
    const { service, ...restProps } = this.props;
    return {
      ...restProps,
      examples: includeExamples ? this.getExamples() : null,
    }
  }

  public toString(): string {
    return kleur.blue(this.props.id);
  }

  public get id() {
    return this.props.id;
  }

  public get displayName() {
    return this.props.displayName;
  }

  public get service(): Readonly<Service> {
    return this.props.service;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get deprecated(): boolean {
    return this.props.deprecated;
  }

  public get cachePolicy(): Readonly<ServiceActionCachePolicy> | null {
    return this.props.cachePolicy;
  }

  public get meta(): Readonly<object> | null {
    return this.props.meta;
  }

  public addExample(example: ActionExample, limit: number): void {
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
}
