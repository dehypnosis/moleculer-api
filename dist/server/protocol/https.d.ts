/// <reference types="node" />
import tls from "tls";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application";
import { listeningURI, ServerProtocol, ServerProtocolProps } from "./protocol";
export declare type ServerHTTPSProtocolOptions = {
    port: number;
    hostname: string;
} & tls.SecureContextOptions;
export declare class ServerHTTPSProtocol extends ServerProtocol {
    static readonly key = "https";
    static readonly autoLoadOptions = false;
    private readonly opts;
    private server?;
    constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTPSProtocolOptions>);
    start(modules: ServerApplicationComponentModules): Promise<listeningURI[]>;
    stop(): Promise<void>;
}
