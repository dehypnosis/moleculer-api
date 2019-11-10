import { validateInlineFunction, ValidationRule } from "../../../interface";

/* common validation schema */

const map = {
  type: "custom",
  optional: true,
  check(value: any) {
    if (validateInlineFunction(value)) {
      return true;
    }
    return [{
      type: "invalidFunctionString",
      expected: "JavaScriptFunctionString",
      actual: value,
      message: "MapConnectorSchema should be a string which denotes a JavaScript function",
    }];
  },
};

const requiredMap = {
  ...map,
  optional: false,
};

const params = [
  {
    type: "object",
    strict: false,
  },
  {
    type: "string",
  },
];

export const ConnectorValidator: { [connector in "call" | "params" | "publish" | "subscribe" | "map"]: ValidationRule } = {
  call: {
    type: "object",
    strict: true,
    props: {
      action: {
        type: "string",
      },
      params,
      map,
    },
  },
  publish: {
    type: "object",
    strict: true,
    props: {
      event: [
        {type: "string"},
        requiredMap,
      ],
      params,
      groups: {
        type: "array",
        optional: true,
        empty: false,
        items: {
          type: "string",
        },
      },
      broadcast: {
        type: "boolean",
        optional: true,
      },
      filter: map,
      map,
    },
  },
  subscribe: {
    type: "object",
    strict: true,
    props: {
      events: [
        {
          type: "array",
          empty: false,
          items: {
            type: "string",
          },
        },
        requiredMap,
      ],
      filter: map,
      map,
    },
  },
  map: requiredMap,
  params,
};
