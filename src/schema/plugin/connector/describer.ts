import { CallConnectorCatalog, CallConnectorSchema } from "./schema";

// TODO: Catalog for each connectors scheme....
export const ConnectorDescriber = {
  call(schema: Readonly<CallConnectorSchema>): CallConnectorCatalog {
    return {
      type: "call",
      map: null,
      status: () => ({message: "TODO", code: 123, updatedAt: new Date()}),
      policies: [],
      action: "test",
      params: {},
    };
  },
};
