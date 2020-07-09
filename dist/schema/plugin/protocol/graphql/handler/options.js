"use strict";
/*
  GraphQL Plugin default options for base schema and resolvers
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGraphQLHandlersOptions = void 0;
const apollo_server_caching_1 = require("apollo-server-caching");
const graphql_upload_1 = require("graphql-upload");
const graphql_type_json_1 = require("graphql-type-json");
const graphql_iso_date_1 = require("graphql-iso-date");
delete graphql_upload_1.GraphQLUpload.description;
delete graphql_type_json_1.GraphQLJSON.description;
delete graphql_iso_date_1.GraphQLDate.description;
delete graphql_iso_date_1.GraphQLDateTime.description;
delete graphql_iso_date_1.GraphQLTime.description;
const typeDefs = [];
const resolvers = {};
/* default scalar types */
typeDefs.push(`
"""
Upload scalar type
@input: [GraphQL multipart request spec](https://github.com/jaydenseric/graphql-multipart-request-spec)
@output: { filename, mimetype, encoding, createReadStream }
filename           string     File name.
mimetype          string    File MIME type. Provided by the client and can’t be trusted.
encoding          string    File stream transfer encoding.
createReadStream  Function  Returns a Node.js readable stream of the file contents, for processing and storing the file. Multiple calls create independent streams. Throws if called after all resolvers have resolved, or after an error has interrupted the request.
"""
scalar Upload
`);
resolvers.Upload = graphql_upload_1.GraphQLUpload;
typeDefs.push(`
"""
JSON scalar type
@input: JSON string
@output: Result of JSON.parse(@input)
"""
scalar JSON
`);
resolvers.JSON = graphql_type_json_1.GraphQLJSON;
typeDefs.push(`
"""
Date scalar type
@input: RFC3339 full-date string: "2007-12-03"
@output: Date instance
"""
scalar Date
`);
resolvers.Date = graphql_iso_date_1.GraphQLDate;
typeDefs.push(`
"""
Time scalar type
@input: RFC3339 full-time string (UTC): "13:10:20Z"
@output: Date instance
"""
scalar Time
`);
resolvers.Time = graphql_iso_date_1.GraphQLTime;
typeDefs.push(`
"""
DateTime scalar Type
@input: RFC3339 date-time string (UTC): "2016-01-01T13:10:20Z"
@output: Date instance
"""
scalar DateTime
`);
resolvers.DateTime = graphql_iso_date_1.GraphQLDateTime;
exports.defaultGraphQLHandlersOptions = {
    typeDefs,
    resolvers,
    subscriptions: {
        keepAlive: 1000,
    },
    persistedQueries: {
        cache: new apollo_server_caching_1.InMemoryLRUCache({
            maxSize: 1000,
        }),
    },
    tracing: true,
    playground: true,
    introspection: true,
    debug: false,
};
//# sourceMappingURL=options.js.map