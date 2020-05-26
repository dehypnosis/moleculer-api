import { RecursivePartial } from "../../interface";
import { ServerHTTPProtocol, ServerHTTPProtocolOptions } from "./http";
import { ServerHTTP2Protocol, ServerHTTP2ProtocolOptions } from "./http2";
import { ServerHTTPSProtocol, ServerHTTPSProtocolOptions } from "./https";
import { ServerProtocol } from "./protocol";
export { ServerProtocol };
export declare const ServerProtocolConstructors: {
    http: typeof ServerHTTPProtocol;
    https: typeof ServerHTTPSProtocol;
    http2: typeof ServerHTTP2Protocol;
};
export declare type ServerProtocolConstructorOptions = {
    [ServerHTTPProtocol.key]: RecursivePartial<ServerHTTPProtocolOptions> | false;
    [ServerHTTPSProtocol.key]: RecursivePartial<ServerHTTPSProtocolOptions> | false;
    [ServerHTTP2Protocol.key]: RecursivePartial<ServerHTTP2ProtocolOptions> | false;
};
export declare const defaultServerProtocolConstructorOptions: ServerProtocolConstructorOptions;
