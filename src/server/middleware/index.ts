export { ServerMiddleware } from "./middleware";
import { RecursivePartial } from "../../interface";
import { CORSMiddleware, CORSMiddlewareOptions } from "./cors";
import { HelmetMiddleware, HelmetMiddlewareOptions } from "./helmet";
import { ServeStaticMiddleware, ServeStaticMiddlewareOptions } from "./serve-static";
import { BodyParserMiddleware, BodyParserMiddlewareOptions } from "./body-parser";
import { LoggingMiddleware, LoggingMiddlewareOptions } from "./logging";
import { ErrorMiddleware, ErrorMiddlewareOptions } from "./error";

export const ServerMiddlewareConstructors = {
  [HelmetMiddleware.key]: HelmetMiddleware,
  [CORSMiddleware.key]: CORSMiddleware,
  [ServeStaticMiddleware.key]: ServeStaticMiddleware,
  [BodyParserMiddleware.key]: BodyParserMiddleware,
  [LoggingMiddleware.key]: LoggingMiddleware,
  // [OtherMiddleware.key]: OtherMiddleware,
  [ErrorMiddleware.key]: ErrorMiddleware,
};

export type ServerMiddlewareConstructorOptions = {
  [HelmetMiddleware.key]: RecursivePartial<HelmetMiddlewareOptions> | false,
  [CORSMiddleware.key]: RecursivePartial<CORSMiddlewareOptions> | false,
  [ServeStaticMiddleware.key]: RecursivePartial<ServeStaticMiddlewareOptions> | false,
  [BodyParserMiddleware.key]: RecursivePartial<BodyParserMiddlewareOptions> | false,
  [LoggingMiddleware.key]: RecursivePartial<LoggingMiddlewareOptions> | false,
  [ErrorMiddleware.key]: RecursivePartial<ErrorMiddlewareOptions> | false,
  // [OtherMiddleware.key]: RecursivePartial<OtherMiddlewareOptions> | false
};

/* orders matter */
export const defaultServerMiddlewareConstructorOptions: ServerMiddlewareConstructorOptions = {
  [HelmetMiddleware.key]: HelmetMiddleware.autoLoadOptions,
  [CORSMiddleware.key]: CORSMiddleware.autoLoadOptions,
  [ServeStaticMiddleware.key]: ServeStaticMiddleware.autoLoadOptions,
  [BodyParserMiddleware.key]: BodyParserMiddleware.autoLoadOptions,
  [LoggingMiddleware.key]: LoggingMiddleware.autoLoadOptions,
  [ErrorMiddleware.key]: ErrorMiddleware.autoLoadOptions,
  // [OtherMiddleware.key]: OtherMiddleware.autoLoadOptions,
};
