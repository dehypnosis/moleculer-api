export { ServerMiddleware } from "./middleware";
import { RecursivePartial } from "../../interface";
import { CORSMiddleware, CORSMiddlewareOptions } from "./cors";
import { HelmetMiddleware, HelmetMiddlewareOptions } from "./helmet";
import { ServeStaticMiddleware, ServeStaticMiddlewareOptions } from "./serve-static";
import { BodyParserMiddleware, BodyParserMiddlewareOptions } from "./body-parser";
import { LoggingMiddleware, LoggingMiddlewareOptions } from "./logging";

export const ServerMiddlewareConstructors = {
  [HelmetMiddleware.key]: HelmetMiddleware,
  [CORSMiddleware.key]: CORSMiddleware,
  [ServeStaticMiddleware.key]: ServeStaticMiddleware,
  [BodyParserMiddleware.key]: BodyParserMiddleware,
  [LoggingMiddleware.key]: LoggingMiddleware,
  // [OtherMiddleware.key]: OtherMiddleware,
};

export type ServerMiddlewareConstructorOptions = Array<{
  [HelmetMiddleware.key]: RecursivePartial<HelmetMiddlewareOptions> | false,
} | {
  [CORSMiddleware.key]: RecursivePartial<CORSMiddlewareOptions> | false,
} | {
  [ServeStaticMiddleware.key]: RecursivePartial<ServeStaticMiddlewareOptions> | false,
} | {
  [BodyParserMiddleware.key]: RecursivePartial<BodyParserMiddlewareOptions> | false,
} | {
  [LoggingMiddleware.key]: RecursivePartial<LoggingMiddlewareOptions> | false,
}/* | {
  [OtherMiddleware.key]: RecursivePartial<OtherMiddlewareOptions> | false,
}*/ | {
  [key: string]: never,
}>;

/* orders matter */
export const defaultServerMiddlewareConstructorOptions: ServerMiddlewareConstructorOptions = [
  {[HelmetMiddleware.key]: HelmetMiddleware.autoLoadOptions},
  {[CORSMiddleware.key]: CORSMiddleware.autoLoadOptions},
  {[ServeStaticMiddleware.key]: ServeStaticMiddleware.autoLoadOptions},
  {[BodyParserMiddleware.key]: BodyParserMiddleware.autoLoadOptions},
  {[LoggingMiddleware.key]: LoggingMiddleware.autoLoadOptions},
  // { [OtherMiddleware.key]: OtherMiddleware.autoLoadOptions },
];
