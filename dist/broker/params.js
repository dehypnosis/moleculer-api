"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
class ParamsMapper {
    constructor(props) {
        this.props = props;
        const { reporter, batchingEnabled, explicitMappableKeys, implicitMappableKeys, paramsSchema } = props;
        let explicitMapping;
        let rootObjectMapping = false;
        if (typeof props.explicitMapping === "string") {
            if (props.explicitMapping) {
                rootObjectMapping = true;
                explicitMapping = { [ParamsMapper.rootObjectKey]: props.explicitMapping };
            }
            else {
                explicitMapping = {};
            }
        }
        else {
            explicitMapping = props.explicitMapping;
        }
        const info = this.info = {};
        const batchingParamNames = this.batchingParamNames = batchingEnabled ? [] : null;
        let mapper = () => ({});
        // apply explicit mapping options
        const directParams = {};
        const mappedParamNames = [];
        OUTER: for (const [paramName, paramMapping] of Object.entries(explicitMapping)) {
            // @body, @body.foo, @body@, @body..., @body.bar:boolean, @body.zzz:number, @body:number, blabla, @blabla, @body.id[]
            if (typeof paramMapping === "string" && paramMapping.startsWith(ParamsMapper.mappablePrefix)) {
                // => @body, @body.foo, @body@, @body..., @body.bar:boolean, @body.zzz:number, @body:number, @blabla, @body.id[]
                let paramPath = paramMapping.substr(1);
                // => body, body.foo, body@, body..., body.bar:boolean, body.zzz:number, body:number, blabla, body.id[]
                for (const mappableKey of explicitMappableKeys) {
                    if (paramPath.startsWith(mappableKey)) {
                        // => body, body.foo, body@, body..., body.bar:boolean, body.zzz:number, body:number, body.id[]
                        // prepare batching
                        let batching = false;
                        if (paramPath.endsWith("[]")) {
                            paramPath = paramPath.substr(0, paramPath.length - 2);
                            if (batchingParamNames) {
                                batching = true;
                                // check hint schema has Array type param schema
                                if (paramsSchema && paramsSchema[paramName]) {
                                    const paramSchema = paramsSchema[paramName];
                                    if (!(paramSchema.type === "array" ||
                                        paramSchema.type === "oneOf"
                                            && paramSchema.items
                                            && paramSchema.items.some(rule => rule.type === "array"))) {
                                        const err = new Error("given params schema seems not to support batching");
                                        err.paramName = paramName;
                                        err.paramMapping = paramMapping;
                                        err.paramPath = paramPath;
                                        err.paramSchema = paramSchema;
                                        reporter.warn(err);
                                    }
                                }
                                // remember the param name
                                batchingParamNames.push(paramName);
                            }
                            else { // batching is disabled for this mapper
                                const err = new Error("this params mapper does not support batching");
                                err.paramName = paramName;
                                err.paramMapping = paramMapping;
                                err.paramPath = paramPath;
                                reporter.error(err);
                            }
                        }
                        // => body, body.foo, body@, body..., body.bar:boolean, body.zzz:number, body:number, body.id
                        // prepare typecasting
                        let typecasting = null;
                        if (paramPath.endsWith(":boolean")) {
                            paramPath = paramPath.substr(0, paramPath.length - 8);
                            typecasting = "boolean";
                        }
                        else if (paramPath.endsWith(":number")) {
                            paramPath = paramPath.substr(0, paramPath.length - 8);
                            typecasting = "number";
                        }
                        // => body, body.foo, body@, body..., body.bar, body.zzz, body.id
                        // object or property mapping
                        if (paramPath === mappableKey || paramPath.startsWith(mappableKey + ".")) {
                            // => body, body.foo, body..., body.bar, body.zzz
                            // tslint:disable-next-line:no-shadowed-variable
                            const prevMapper = mapper;
                            mapper = args => {
                                let paramValue = _.get(args, paramPath);
                                if (typeof paramValue === "undefined") {
                                    const err = new Error("cannot map params with property path");
                                    err.paramName = paramName;
                                    err.paramMapping = paramMapping;
                                    err.paramPath = paramPath;
                                    err.args = args;
                                    reporter.warn(err);
                                }
                                else {
                                    switch (typecasting) {
                                        case "boolean":
                                            paramValue = !(paramValue === false || paramValue === 0 || paramValue === "false" || paramValue === "0");
                                            break;
                                        case "number":
                                            const castedParamValue = parseFloat(paramValue);
                                            if (isNaN(castedParamValue)) {
                                                const err = new Error("cannot map params with number typecasting");
                                                err.paramName = paramName;
                                                err.paramMapping = paramMapping;
                                                err.paramPath = paramPath;
                                                err.paramValue = paramValue;
                                                err.args = args;
                                                reporter.warn(err);
                                            }
                                            else {
                                                paramValue = castedParamValue;
                                            }
                                            break;
                                    }
                                }
                                // merge params
                                const params = prevMapper(args);
                                params[paramName] = paramValue;
                                return params;
                            };
                            // mapping done
                            info[paramName] = {
                                strategy: "explicit",
                                batching,
                                typecasting,
                                path: paramPath,
                                schema: paramsSchema && paramsSchema[paramName] || null,
                            };
                            mappedParamNames.push(paramName);
                            continue OUTER;
                        }
                    }
                }
                // => body@
            }
            // apply direct mapping for non-string value and unmapped params
            directParams[paramName] = paramMapping;
            // mapping done
            info[paramName] = {
                strategy: "explicit",
                value: paramMapping,
                schema: paramsSchema && paramsSchema[paramName] || null,
            };
            mappedParamNames.push(paramName);
        }
        const prevMapper = mapper;
        mapper = args => (Object.assign(Object.assign({}, directParams), prevMapper(args)));
        // apply implicit mapping for rest params with hinted schema
        if (paramsSchema && implicitMappableKeys && implicitMappableKeys.length > 0) {
            const implicitMappableParamNames = Object.keys(paramsSchema)
                .filter(paramName => !mappedParamNames.includes(paramName));
            if (implicitMappableParamNames.length > 0) {
                for (const paramName of implicitMappableParamNames) {
                    info[paramName] = {
                        strategy: "implicit",
                        candidatePaths: implicitMappableKeys.map(mappableKey => `${mappableKey}.${paramName}`),
                        schema: paramsSchema && paramsSchema[paramName] || null,
                    };
                }
                // warn implicit mapping
                const err = new Error("implicit params mapping can be dangerous");
                err.paramNames = implicitMappableParamNames;
                reporter.warn(err);
                // tslint:disable-next-line:no-shadowed-variable
                const prevMapper = mapper;
                mapper = args => {
                    const params = prevMapper(args);
                    OUTER: for (const paramName of implicitMappableParamNames) {
                        for (const mappableKey of implicitMappableKeys) {
                            const paramPath = `${mappableKey}.${paramName}`;
                            const paramValue = _.get(args, paramPath);
                            if (typeof paramValue !== "undefined") {
                                params[paramName] = paramValue;
                                // mapping done
                                continue OUTER;
                            }
                        }
                        // all mapping strategy failed: kind of bad request
                    }
                    return params;
                };
            }
        }
        // bring out root object mapping
        if (rootObjectMapping) {
            // tslint:disable-next-line:no-shadowed-variable
            const prevMapper = mapper;
            mapper = args => prevMapper(args)[ParamsMapper.rootObjectKey];
        }
        this.mapper = mapper;
    }
    map(args) {
        // map args to params
        const params = this.mapper(args);
        // batching disabled
        if (!this.batchingParamNames) {
            return { params, batchingParams: null };
        }
        // separate batching params
        const result = Object.keys(params)
            .reduce((res, paramName) => {
            (this.batchingParamNames.includes(paramName) ? res.batchingParams : res.params)[paramName] = params[paramName];
            return res;
        }, {
            params: {},
            batchingParams: {},
        });
        if (Object.keys(result.params).length === 0) {
            result.params = null;
        }
        if (Object.keys(result.batchingParams).length === 0) {
            result.batchingParams = null;
        }
        return result;
    }
}
exports.ParamsMapper = ParamsMapper;
ParamsMapper.mappablePrefix = "@";
ParamsMapper.rootObjectKey = "__root__";
//# sourceMappingURL=params.js.map