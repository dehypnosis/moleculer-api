import { RecursivePartial, ValidationError } from "../../../../interface";
import { Branch } from "../../../branch";
import { ServiceAPIIntegration } from "../../../integration";
import { Route } from "../../../../server";
import { ProtocolPlugin, ProtocolPluginProps } from "../plugin";
import { RESTProtocolPluginSchema, RESTProtocolPluginCatalog } from "./schema";
export declare type RESTProtocolPluginOptions = {
    uploads: {
        maxFiles: number;
        maxFileSize: number;
    };
    introspection: boolean;
};
export declare class RESTProtocolPlugin extends ProtocolPlugin<RESTProtocolPluginSchema, RESTProtocolPluginCatalog> {
    protected readonly props: ProtocolPluginProps;
    static readonly key = "REST";
    static readonly autoLoadOptions: RESTProtocolPluginOptions;
    private readonly opts;
    constructor(props: ProtocolPluginProps, opts?: RecursivePartial<RESTProtocolPluginOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    validateSchema(schema: RESTProtocolPluginSchema): ValidationError[];
    compileSchemata(routeHashMapCache: Readonly<Map<string, Readonly<Route>>>, integrations: Readonly<ServiceAPIIntegration>[], branch: Branch): {
        hash: string;
        route: Readonly<Route>;
    }[];
    private createRouteFromMapConnectorScheme;
    private createRouteFromCallConnectorScheme;
    private createRouteFromPublishConnectorScheme;
    describeSchema(schema: Readonly<RESTProtocolPluginSchema>): RESTProtocolPluginCatalog;
    private sendResponse;
}
