import { Pluggable } from "../../interface";
import { Logger } from "../../logger";
import { ServerApplicationComponentModules } from "../application/component";
export declare type ServerMiddlewareProps = {
    logger: Logger;
};
export declare abstract class ServerMiddleware extends Pluggable {
    protected readonly props: ServerMiddlewareProps;
    constructor(props: ServerMiddlewareProps, opts?: any);
    abstract apply(modules: ServerApplicationComponentModules): void;
}
