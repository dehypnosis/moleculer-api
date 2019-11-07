import http from "http";
import ws from "ws";
import { getLogger, sleep } from "../../../../test";
import { ServerWebSocketApplication } from "./component";
import { WebSocketRoute } from "./route";

const wsApp = new ServerWebSocketApplication({
  logger: getLogger(),
});
const httpServer = http.createServer()
  .on("upgrade", wsApp.module.upgradeEventHandler);

beforeAll(async () => {
  await wsApp.start();
  httpServer.listen(8888);
});

describe("websocket application should work with routes", () => {
  const mocks = {open: jest.fn(), message: jest.fn(), close: jest.fn(), createContext: jest.fn(async () => "dummy")};
  let createdContext: any;
  const message = JSON.stringify({data: Math.random() * 1000});
  wsApp.mountRoutes([
    new WebSocketRoute({
      path: "/chat",
      description: null,
      handler: (context, socket, req) => {
        createdContext = context;
        socket.send(message, err => err && console.error(err));
        socket.close();
      },
    }),
  ], ["/", "/~master"], mocks.createContext as any);

  const wsClient = new ws("ws://localhost:8888/chat");
  wsClient.once("open", mocks.open);
  wsClient.once("message", mocks.message);
  wsClient.once("close", mocks.close);

  const wsClient2 = new ws("ws://localhost:8888/~master/chat");
  wsClient2.once("open", mocks.open);
  wsClient2.once("message", mocks.message);
  wsClient2.once("close", mocks.close);

  beforeAll(() => sleep(1));

  it("context should be created", () => expect(createdContext).toEqual("dummy"));

  it("handler should have been called twice", () => {
    expect(mocks.createContext).toBeCalledTimes(2);
  });

  it("wsClient should be open for all prefixes", () => {
    expect(mocks.open).toHaveBeenCalledTimes(2);
  });

  it("wsClient should get message from defined route handler", () => {
    expect(mocks.close).toHaveBeenCalledTimes(2);
    expect(mocks.message).toHaveBeenCalledWith(message);
  });

  it("wsClient could be closed from server", () => {
    expect(mocks.close).toHaveBeenCalledTimes(2);
  });
});

afterAll(() => {
  httpServer.close();
});
