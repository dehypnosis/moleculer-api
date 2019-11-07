import * as http from "http";
import * as http2 from "http2";
import { Pluggable } from "../../../../interface";
import { Logger } from "../../../../logger";

export type APIRequestContextSource = Readonly<http.IncomingMessage | http2.Http2ServerRequest>;

export type APIRequestContextFactoryProps = {
  logger: Logger;
};

export abstract class APIRequestContextFactory<T> extends Pluggable {
  constructor(protected readonly props: APIRequestContextFactoryProps, opts?: any) {
    super();
  }

  public abstract create(source: APIRequestContextSource): Promise<T> | T;
}
