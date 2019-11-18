import * as Moleculer from "moleculer";
import { RecursivePartial } from "../interface";
import { ServiceAPISchema, ServiceMetaDataSchema } from "../schema";
export declare function getMoleculerServiceBroker(props?: {
    logger?: {
        label?: string;
        level?: "info" | "warn" | "debug" | "error";
    };
    services?: Array<Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    }>;
    moleculer?: Moleculer.BrokerOptions;
}): Moleculer.ServiceBroker;
export declare const MoleculerServiceSchemaFactory: {
    [key: string]: (branch: string | null, name: string, schemaAdjust?: RecursivePartial<ServiceAPISchema>) => Moleculer.ServiceSchema & {
        metadata?: ServiceMetaDataSchema;
    };
};
