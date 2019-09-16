export type RecursivePartial<T> = {
  [P in keyof T]?:
  T[P] extends (infer U)[] ? Array<RecursivePartial<U>> :
    T[P] extends object ? RecursivePartial<T[P]> :
      T[P];
};

export * from "./hash";
export * from "./serialization";
export * from "./stream";
export * from "./validation";
export * from "./pluggable";
export * from "./async-iterator";
