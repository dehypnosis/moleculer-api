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
}

export abstract class Pluggable extends HasStaticKey {
  public static readonly autoLoadOptions: object | false;
  constructor() {
    super();
    const constructor = this.constructor as typeof Pluggable;
    if (typeof constructor.autoLoadOptions === "undefined") {
      throw new Error(`${constructor.name}.autoLoadOptions public static field required`);
    }
  }
}
