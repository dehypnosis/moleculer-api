import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application";
import { listeningURI, ServerProtocol, ServerProtocolProps } from "./protocol";
export declare type ServerHTTPProtocolOptions = {
    port: number;
    hostname: string;
};
export declare class ServerHTTPProtocol extends ServerProtocol {
    static readonly key = "http";
    static readonly autoLoadOptions: ServerHTTPProtocolOptions;
    private readonly opts;
    private server?;
    constructor(props: ServerProtocolProps, opts?: RecursivePartial<ServerHTTPProtocolOptions>);
    start(modules: ServerApplicationComponentModules): Promise<listeningURI[]>;
    stop(): Promise<void>;
}
