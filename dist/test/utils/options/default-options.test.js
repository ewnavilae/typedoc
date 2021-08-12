"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const shiki_1 = require("shiki");
const utils_1 = require("../../../lib/utils");
describe("Default Options", () => {
    const opts = new utils_1.Options(new utils_1.Logger());
    opts.addDefaultDeclarations();
    describe("highlightTheme", () => {
        it("Errors if an invalid theme is provided", () => {
            assert_1.throws(() => opts.setValue("highlightTheme", "randomTheme"));
            opts.setValue("highlightTheme", shiki_1.BUNDLED_THEMES[0]);
            assert_1.strictEqual(opts.getValue("highlightTheme"), shiki_1.BUNDLED_THEMES[0]);
        });
    });
    describe("sort", () => {
        it("Errors if an invalid sort version is provided", () => {
            assert_1.throws(() => opts.setValue("sort", ["random", "alphabetical"]));
        });
        it("Reports which sort option(s) was invalid", () => {
            try {
                opts.setValue("sort", [
                    "random",
                    "alphabetical",
                    "foo",
                ]);
            }
            catch (e) {
                assert_1.ok(e.message.includes("random"));
                assert_1.ok(e.message.includes("foo"));
            }
        });
    });
});
