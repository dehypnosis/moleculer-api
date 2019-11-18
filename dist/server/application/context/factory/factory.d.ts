/// <reference types="node" />
import * as http from "http";
import * as http2 from "http2";
import { Pluggable } from "../../../../interface";
import { Logger } from "../../../../logger";
export declare type APIRequestContextSource = Readonly<http.IncomingMessage | http2.Http2ServerRequest>;
export declare type APIRequestContextFactoryProps = {
    logger: Logger;
};
export declare abstract class APIRequestContextFactory<T> extends Pluggable {
    protected readonly props: APIRequestContextFactoryProps;
    constructor(props: APIRequestContextFactoryProps, opts?: any);
    abstract create(source: APIRequestContextSource): Promise<T> | T;
}
