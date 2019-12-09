"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moleculer_1 = require("moleculer");
const greeter_1 = require("./greeter");
describe("Test 'greeter' service", () => {
    const broker = new moleculer_1.ServiceBroker();
    broker.createService(greeter_1.GreeterServiceSchema);
    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
    describe("Test 'greeter.hello' action", () => {
        it("should return with 'Hello Moleculer'", () => {
            expect(broker.call("greeter.hello")).resolves.toBe("Hello Moleculer");
        });
    });
    describe("Test 'greeter.welcome' action", () => {
        it("should return with 'Welcome'", () => {
            expect(broker.call("greeter.welcome", { name: "Adam" })).resolves.toBe("Welcome, Adam");
        });
        it("should reject an ValidationError", () => {
            expect(broker.call("greeter.welcome")).rejects.toBeInstanceOf(moleculer_1.Errors.ValidationError);
        });
    });
});
//# sourceMappingURL=greeter._spec.js.map