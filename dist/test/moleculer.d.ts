import * as Moleculer from "moleculer";
import { ServiceMetaDataSchema } from "../schema";
export declare function getMoleculerServiceBroker(props?: {
    logger?: {
        label?: string;
        level?: "info" | "warn" | "debug" | "error";
    };
    services?: (Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    })[];
    moleculer?: Moleculer.BrokerOptions;
}): Moleculer.ServiceBroker;
export declare const MoleculerServiceSchemaFactory: {
    [key: string]: (branch: string | null, name: string, schemaAdjust?: any) => Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    };
};
