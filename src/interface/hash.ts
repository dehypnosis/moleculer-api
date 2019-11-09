import objectHash from "object-hash";

export function hashObject(v: any, respectArrayOrders: boolean = false): string {
  return objectHash(v, {
    algorithm: "md5",
    unorderedArrays: !respectArrayOrders,
    unorderedObjects: true,
    unorderedSets: true,
  });
}
