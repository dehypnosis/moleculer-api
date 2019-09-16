import * as _ from "lodash";
/*
  can configure NamePatternResolver options to handle action and event name in different way for your delegator
  default way:
    sports.* matches sports.xxx. sports.yyy but sports.xxx.zzz
    sports.** matches sports.xxx.zzz too
    * matches sports but sports.xxx
    ** matches all
 */

export type NamePatternResolver = (topic: string) => string[];

export const defaultNamePatternResolver: NamePatternResolver = _.memoize(
  (name: string): string[] => {
    const topics = [name];
    const tokens = name.split(".").filter(t => t !== ".");
    let isSuffix = true;
    while (tokens.length > 0) {
      tokens.pop();
      const topic = tokens.join(".") + (isSuffix ? ".*" : ".**");
      if (topic === ".*") {
        topics.push("*", "**");
      } else if (topic === ".**") {
        topics.push("**");
      } else if (!topics.includes(topic)) {
        topics.push(topic);
      }
      isSuffix = false;
    }
    return topics;
  },
);
