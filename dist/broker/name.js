"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = tslib_1.__importStar(require("lodash"));
exports.defaultNamePatternResolver = _.memoize((name) => {
    const topics = [name];
    const tokens = name.split(".").filter(t => t !== ".");
    let isSuffix = true;
    while (tokens.length > 0) {
        tokens.pop();
        const topic = tokens.join(".") + (isSuffix ? ".*" : ".**");
        if (topic === ".*") {
            topics.push("*", "**");
        }
        else if (topic === ".**") {
            topics.push("**");
        }
        else if (!topics.includes(topic)) {
            topics.push(topic);
        }
        isSuffix = false;
    }
    return topics;
});
//# sourceMappingURL=name.js.map