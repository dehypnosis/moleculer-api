import * as http from "http";
import { getLogger, fetch } from "../../../../test";
import { ServerHTTPApplication } from "./component";
import { HTTPRoute } from "./route";

const httpApp = new ServerHTTPApplication({
  logger: getLogger({level: "error"}),
});

const httpServer = http.createServer(httpApp.module);

beforeAll(async () => {
  await httpApp.start();
  httpServer.listen(8889);
});

describe("http application should work with routes", () => {
  const message = {data: Math.random() * 1000};
  const routeMatched = jest.fn();
  httpApp.mountRoutes([
    new HTTPRoute({
      method: "GET",
      path: "/data",
      description: null,
      handler: (context, req, res) => {
        res.json(message);
      },
    }),
  ], ["/", "/~dev"], routeMatched);

  it("httpClient should got proper response", () => {
    return expect(fetch("http://localhost:8889/data", {method: "GET"}).then(res => res.json()))
      .resolves.toMatchObject(message);
  });

  it("httpClient should mount all given prefixes", () => {
    return expect(fetch("http://localhost:8889/~dev/data", {method: "GET"}).then(res => res.json()))
      .resolves.toMatchObject(message);
  });

  it("handler should have been called twice", () => {
    expect(routeMatched).toBeCalledTimes(2);
  });
});

afterAll(() => {
  httpServer.close();
});
