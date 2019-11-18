import { Pluggable } from "../../interface";
import { Logger } from "../../logger";
import { ServerApplicationComponentModules } from "../application";
export declare type ServerProtocolProps = {
    logger: Logger;
};
export declare type listeningURI = string;
export declare abstract class ServerProtocol extends Pluggable {
    protected readonly props: ServerProtocolProps;
    constructor(props: ServerProtocolProps, opts?: any);
    abstract start(modules: ServerApplicationComponentModules): Promise<listeningURI[]>;
    abstract stop(): Promise<void>;
}
