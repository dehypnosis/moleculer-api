import { Pluggable, ValidationError } from "../../interface";
import { Logger } from "../../logger";
export declare type PluginProps = {
    logger: Logger;
};
export declare abstract class Plugin<PluginSchema, PluginCatalog> extends Pluggable {
    protected readonly props: PluginProps;
    constructor(props: PluginProps, opts?: any);
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract validateSchema(schema: Readonly<PluginSchema>): ValidationError[];
    abstract describeSchema(schema: Readonly<PluginSchema>): PluginCatalog;
}
