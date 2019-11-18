/// <reference types="node" />
import { HTTPRouteRequest, HTTPRouteResponse } from "../../../../../server";
declare type Upload = {
    filename: string;
    encoding: string;
    mimetype: string;
    createReadStream: () => NodeJS.ReadableStream;
};
export declare class MultipartFormDataHandler {
    protected readonly props: {
        maxFiles: number;
        maxFileSize: number;
    };
    constructor(props: {
        maxFiles: number;
        maxFileSize: number;
    });
    collect(req: HTTPRouteRequest, res: HTTPRouteResponse): Promise<{
        [fieldName: string]: Upload;
    } | null>;
    private wasteStream;
}
export {};
