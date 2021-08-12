"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Assert = require("assert");
describe("Project", function () {
    describe("splitUnquotedString", () => {
        let result;
        it("unquoted string", function () {
            result = __1.splitUnquotedString("foo.bar", ".");
            Assert.strictEqual(result.length, 2, "Wrong length");
            Assert.strictEqual(result[0], "foo", "Wrong split");
            Assert.strictEqual(result[1], "bar", "Wrong split");
        });
        it("quoted string", function () {
            result = __1.splitUnquotedString('"foo.bar"', ".");
            Assert.strictEqual(result.length, 1, "Wrong length");
            Assert.strictEqual(result[0], '"foo.bar"', "Wrong split");
        });
        it("quoted start, unquoted end", function () {
            result = __1.splitUnquotedString('"foo.d".bar', ".");
            Assert.strictEqual(result.length, 2, "Wrong length");
            Assert.strictEqual(result[0], '"foo.d"', "Wrong split");
            Assert.strictEqual(result[1], "bar", "Wrong split");
        });
        it("unmatched quotes", function () {
            result = __1.splitUnquotedString('"foo.d', ".");
            Assert.strictEqual(result.length, 2, "Wrong length");
            Assert.strictEqual(result[0], '"foo', "Wrong split");
            Assert.strictEqual(result[1], "d", "Wrong split");
        });
    });
});
