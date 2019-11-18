import { NormalizedValidationSchema } from "../interface";
import { Reporter } from "./reporter";
export declare type ParamsMappingInfo = {
    [paramName: string]: ({
        strategy: "explicit";
        typecasting: "boolean" | "number" | null;
        batching: boolean;
        path: string;
    } | {
        strategy: "explicit";
        value: any;
    } | {
        strategy: "implicit";
        candidatePaths: string[];
    }) & {
        schema: NormalizedValidationSchema[string] | null;
    };
};
export declare type ParamsMapperProps = {
    reporter: Reporter;
    explicitMapping: {
        [paramName: string]: any;
    } | string;
    explicitMappableKeys: string[];
    implicitMappableKeys: string[] | null;
    paramsSchema: NormalizedValidationSchema | null;
    batchingEnabled: boolean;
};
export declare class ParamsMapper<MappableArgs extends {
    [key: string]: any;
}> {
    protected readonly props: ParamsMapperProps;
    static readonly mappablePrefix = "@";
    private static readonly rootObjectKey;
    readonly info: ParamsMappingInfo;
    private readonly mapper;
    private readonly batchingParamNames;
    constructor(props: ParamsMapperProps);
    map(args: MappableArgs): {
        params?: any;
        batchingParams?: any;
    };
}
