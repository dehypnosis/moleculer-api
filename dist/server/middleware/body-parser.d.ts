import * as bodyParser from "body-parser";
import { RecursivePartial } from "../../interface";
import { ServerApplicationComponentModules } from "../application/component";
import { ServerMiddleware, ServerMiddlewareProps } from "./middleware";
export declare type BodyParserMiddlewareOptions = {
    json: bodyParser.OptionsJson;
    urlencoded: bodyParser.OptionsUrlencoded;
};
export declare class BodyParserMiddleware extends ServerMiddleware {
    protected readonly props: ServerMiddlewareProps;
    static readonly key = "bodyParser";
    static readonly autoLoadOptions: BodyParserMiddlewareOptions;
    private readonly opts;
    constructor(props: ServerMiddlewareProps, opts?: RecursivePartial<BodyParserMiddlewareOptions>);
    apply(modules: ServerApplicationComponentModules): void;
}
