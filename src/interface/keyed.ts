import * as kleur from "kleur";

export abstract class HasStaticKey {
  public static readonly key: string;
  public readonly key: string;

  constructor() {
    const constructor = this.constructor as typeof HasStaticKey;
    if (typeof constructor.key === "undefined") {
      throw new Error(`${constructor.name}.key public static field required`);
    }
    this.key = constructor.key;
  }

  public toString(): string {
    return kleur.yellow(this.key);
  }
}
