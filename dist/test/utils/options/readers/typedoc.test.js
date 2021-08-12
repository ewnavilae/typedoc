"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const assert_1 = require("assert");
const readers_1 = require("../../../../lib/utils/options/readers");
const utils_1 = require("../../../../lib/utils");
describe("Options - TypeDocReader", () => {
    const options = new utils_1.Options(new utils_1.Logger());
    options.addDefaultDeclarations();
    options.addReader(new readers_1.TypeDocReader());
    function test(name, input, cb) {
        it(name, () => {
            options.reset();
            options.setValue("options", input);
            options.read(new utils_1.ConsoleLogger());
            cb();
        });
    }
    test("Supports extends", path_1.join(__dirname, "data/extends.json"), () => {
        assert_1.deepStrictEqual(options.getValue("name"), "extends");
        assert_1.deepStrictEqual(options.getValue("gitRevision"), "master");
    });
    function testError(name, file) {
        it(name, () => {
            options.reset();
            options.setValue("options", file);
            const logger = new utils_1.Logger();
            options.read(logger);
            assert_1.deepStrictEqual(logger.hasErrors(), true, "No error was logged");
        });
    }
    testError("Errors if the file cannot be found", path_1.join(__dirname, "data/non-existent-file.json"));
    testError("Errors if the data is invalid", path_1.join(__dirname, "data/invalid.json"));
    testError("Errors if any set option errors", path_1.join(__dirname, "data/unknown.json"));
    testError("Errors if extends results in a loop", path_1.join(__dirname, "data/circular-extends.json"));
    it("Does not error if the option file cannot be found but was not set.", () => {
        const options = new (class LyingOptions extends utils_1.Options {
            isSet() {
                return false;
            }
        })(new utils_1.Logger());
        options.addDefaultDeclarations();
        options.addReader(new readers_1.TypeDocReader());
        const logger = new utils_1.Logger();
        options.read(logger);
        assert_1.deepStrictEqual(logger.hasErrors(), false);
    });
});
