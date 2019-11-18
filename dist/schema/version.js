"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const kleur = tslib_1.__importStar(require("kleur"));
const interface_1 = require("../interface");
const integration_1 = require("./integration");
class Version {
    constructor(props) {
        this.props = props;
        this.$integrations = [];
        this.hash = interface_1.hashObject([...props.schemaHashMap.keys(), ...props.routeHashMap.keys()], false);
        this.shortHash = this.hash.substr(0, 8);
    }
    toString() {
        return kleur.yellow(`${this.shortHash} (${this.props.schemaHashMap.size} schemata, ${this.props.routeHashMap.size} routes)`);
    }
    getChildVersionProps() {
        return {
            schemaHashMap: new Map(this.props.schemaHashMap),
            routeHashMapCache: this.props.routeHashMap,
        };
    }
    addIntegrationHistory(integration) {
        console.assert(integration.status !== "queued", "cannot add unprocessed job to existing version");
        this.$integrations.push(integration);
    }
    forgetParentVersion() {
        this.props.parentVersion = null;
    }
    get parentVersion() {
        return this.props.parentVersion;
    }
    get routes() {
        return Array.from(this.props.routeHashMap.values());
    }
    // all integrations including parent versions
    get integrations() {
        return Array.from(this.props.schemaHashMap.values());
    }
    // own integrations derived from current version
    get derivedIntegrations() {
        return this.$integrations;
    }
    getRetryableIntegrations() {
        const retryableIntegrations = this.$integrations
            .filter(integration => integration.status !== integration_1.ServiceAPIIntegration.Status.Succeed);
        for (const integration of retryableIntegrations) {
            this.$integrations.splice(this.$integrations.indexOf(integration), 1);
        }
        return retryableIntegrations.map(integration => integration.clone());
    }
}
exports.Version = Version;
Version.initialVersion = new Version({
    schemaHashMap: new Map(),
    routeHashMap: new Map(),
    parentVersion: null,
});
//# sourceMappingURL=version.js.map