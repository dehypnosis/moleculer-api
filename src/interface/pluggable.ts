import { HasStaticKey } from "./keyed";

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
