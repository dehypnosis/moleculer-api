export { ServerMiddleware } from "./middleware";
import { CORSMiddleware, CORSMiddlewareOptions } from "./cors";
import { HelmetMiddleware, HelmetMiddlewareOptions } from "./helmet";
import { ServeStaticMiddleware, ServeStaticMiddlewareOptions } from "./serve-static";
import { BodyParserMiddleware, BodyParserMiddlewareOptions } from "./body-parser";

export const ServerMiddlewareConstructors = {
  [HelmetMiddleware.key]: HelmetMiddleware,
  [CORSMiddleware.key]: CORSMiddleware,
  [ServeStaticMiddleware.key]: ServeStaticMiddleware,
  [BodyParserMiddleware.key]: BodyParserMiddleware,
  // [OtherMiddleware.key]: OtherMiddleware,
};

export type ServerMiddlewareConstructorOptions = Array<{
  [HelmetMiddleware.key]: HelmetMiddlewareOptions | false,
} | {
  [CORSMiddleware.key]: CORSMiddlewareOptions | false,
} | {
  [ServeStaticMiddleware.key]: ServeStaticMiddlewareOptions | false,
} | {
  [BodyParserMiddleware.key]: BodyParserMiddlewareOptions | false,
}/* | {
  [OtherMiddleware.key]: OtherMiddlewareOptions | false,
}*/ | {
  [key: string]: never,
}>;

/* orders matter */
export const defaultServerMiddlewareConstructorOptions: ServerMiddlewareConstructorOptions = [
  {[HelmetMiddleware.key]: HelmetMiddleware.autoLoadOptions},
  {[CORSMiddleware.key]: CORSMiddleware.autoLoadOptions},
  {[ServeStaticMiddleware.key]: ServeStaticMiddleware.autoLoadOptions},
  {[BodyParserMiddleware.key]: BodyParserMiddleware.autoLoadOptions},
  // { [OtherMiddleware.key]: OtherMiddleware.autoLoadOptions },
];
