import * as kleur from "kleur";

export type ServiceNodeProps = {
  id: string; // should be unique
  displayName: string;
  meta: object | null;
};

export class ServiceNode {
  constructor(protected readonly props: ServiceNodeProps) {
  }

  public get id(): string {
    return this.props.id;
  }

  public get displayName(): string {
    return this.props.displayName;
  }

  public get meta(): Readonly<object> | null {
    return this.props.meta;
  }

  public toString(): string {
    return kleur.green(this.props.id);
  }

  public getInformation() {
    return {...this.props};
  }
}
