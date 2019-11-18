import { HasStaticKey } from "./keyed";
export declare abstract class Pluggable extends HasStaticKey {
    static readonly autoLoadOptions: object | false;
    constructor();
}
