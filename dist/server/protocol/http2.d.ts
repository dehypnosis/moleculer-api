import { RecursivePartial } from "../../interface";
import { ServerProtocol, ServerProtocolProps } from "./protocol";
export declare type ServerHTTP2ProtocolOptions = {};
export declare class ServerHTTP2Protocol extends ServerProtocol {
    static readonly key = "http2";
    static readonly autoLoadOptions = false;
    private readonly opts;
    constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTP2ProtocolOptions>);
    start(): Promise<string[]>;
    stop(): Promise<void>;
}
