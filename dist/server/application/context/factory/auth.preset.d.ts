import { AuthContextParser } from "./auth";
export declare type AuthContextOIDCParserOptions = {
    issuer: string;
    client_id: string;
    client_secret?: string;
};
export declare const createAuthContextOIDCParser: (opts: AuthContextOIDCParserOptions) => AuthContextParser;
