"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const assert_1 = require("assert");
const readers_1 = require("../../../../lib/utils/options/readers");
const utils_1 = require("../../../../lib/utils");
describe("Options - TSConfigReader", () => {
    const options = new utils_1.Options(new utils_1.Logger());
    options.addDefaultDeclarations();
    options.addReader(new readers_1.TSConfigReader());
    function testError(name, file) {
        it(name, () => {
            options.reset();
            options.setValue("tsconfig", file);
            const logger = new utils_1.Logger();
            options.read(logger);
            assert_1.deepStrictEqual(logger.hasErrors(), true, "No error was logged");
        });
    }
    testError("Errors if the file cannot be found", path_1.join(__dirname, "data/non-existent-file.json"));
    testError("Errors if the data is invalid", path_1.join(__dirname, "data/invalid.tsconfig.json"));
    testError("Errors if any set option errors", path_1.join(__dirname, "data/unknown.tsconfig.json"));
    testError("Errors if tsconfig tries to set options file", path_1.join(__dirname, "data/options-file.tsconfig.json"));
    it("Does not error if the option file cannot be found but was not set.", () => {
        const options = new (class LyingOptions extends utils_1.Options {
            isSet() {
                return false;
            }
        })(new utils_1.Logger());
        options.addDefaultDeclarations();
        options.setValue("tsconfig", path_1.join(__dirname, "data/does_not_exist.json"));
        const logger = new utils_1.Logger();
        options.addReader(new readers_1.TSConfigReader());
        options.read(logger);
        assert_1.deepStrictEqual(logger.hasErrors(), false);
    });
    it("Sets files for the program", () => {
        options.reset();
        options.setValue("tsconfig", path_1.join(__dirname, "data/valid.tsconfig.json"));
        options.read(new utils_1.Logger());
        assert_1.deepStrictEqual(options.getFileNames().map((f) => path_1.resolve(f)), [path_1.resolve(__dirname, "./data/file.ts")]);
    });
    it("Allows stripInternal to set excludeInternal", () => {
        options.reset();
        options.setValue("tsconfig", path_1.join(__dirname, "data/stripInternal.tsconfig.json"));
        options.read(new utils_1.Logger());
        assert_1.deepStrictEqual(options.getValue("excludeInternal"), true);
    });
    it("Does not set excludeInternal by stripInternal if already set", () => {
        options.reset();
        options.setValue("tsconfig", path_1.join(__dirname, "data/stripInternal.tsconfig.json"));
        options.setValue("excludeInternal", false);
        options.read(new utils_1.Logger());
        assert_1.deepStrictEqual(options.getValue("excludeInternal"), false);
    });
});
