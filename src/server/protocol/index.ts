import { RecursivePartial } from "../../interface";
import { ServerHTTPProtocol, ServerHTTPProtocolOptions } from "./http";
import { ServerHTTP2Protocol, ServerHTTP2ProtocolOptions } from "./http2";
import { ServerProtocol } from "./protocol";

export { ServerProtocol };

type ServerProtocolClass = typeof ServerProtocol;

interface ServerProtocolInterface extends ServerProtocolClass {
}

export const ServerProtocolConstructors = {
  [ServerHTTPProtocol.key]: ServerHTTPProtocol as ServerProtocolInterface,
  [ServerHTTP2Protocol.key]: ServerHTTP2Protocol as ServerProtocolInterface,
};

export type ServerProtocolConstructorOptions = {
  [ServerHTTPProtocol.key]: RecursivePartial<ServerHTTPProtocolOptions> | false,
  [ServerHTTP2Protocol.key]: RecursivePartial<ServerHTTP2ProtocolOptions> | false,
};

export const defaultServerProtocolConstructorOptions: ServerProtocolConstructorOptions = {
  [ServerHTTPProtocol.key]: ServerHTTPProtocol.autoLoadOptions,
  [ServerHTTP2Protocol.key]: ServerHTTP2Protocol.autoLoadOptions,
};
