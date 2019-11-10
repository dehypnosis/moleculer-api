import { Duplex, DuplexOptions } from "stream";
import ws from "ws";

export function createStreamFromWebSocket(socket: ws, opts: Omit<DuplexOptions, "read"|"write"|"final"> = {}): Duplex {
  const write: DuplexOptions["write"] = (chunk, enc, cb) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(chunk, cb);
    } else {
      // @ts-ignore
      socket.once("open", ignore => write(chunk, enc, cb));
    }
  };

  const stream = new Duplex({
    read: size => {},
    write,
    final: cb => cb(),
    ...opts,
  });

  socket.on("message", chunk => stream.push(chunk));

  return stream;
}
