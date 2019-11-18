/// <reference types="node" />
import { Duplex, DuplexOptions } from "stream";
import ws from "ws";
export declare function createStreamFromWebSocket(socket: ws, opts?: Omit<DuplexOptions, "read" | "write" | "final">): Duplex;
