"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const path_1 = require("path");
const declaration_1 = require("../../../lib/utils/options/declaration");
describe("Options - conversions", () => {
    const optionWithType = (type) => ({
        type,
        defaultValue: undefined,
        name: "test",
        help: "",
    });
    it("Converts to numbers", () => {
        assert_1.deepStrictEqual(declaration_1.convert("123", optionWithType(declaration_1.ParameterType.Number), ""), 123);
        assert_1.deepStrictEqual(declaration_1.convert("a", optionWithType(declaration_1.ParameterType.Number), ""), 0);
        assert_1.deepStrictEqual(declaration_1.convert(NaN, optionWithType(declaration_1.ParameterType.Number), ""), 0);
    });
    it("Converts to number if value is the lowest allowed value for a number option", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 1,
        };
        assert_1.deepStrictEqual(declaration_1.convert(1, declaration, ""), 1);
    });
    it("Generates an error if value is too low for a number option", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 1,
        };
        assert_1.throws(() => declaration_1.convert(0, declaration, ""), new Error("test must be between 1 and 10"));
    });
    it("Generates an error if value is too low for a number option with no max", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            minValue: 1,
            defaultValue: 1,
        };
        assert_1.throws(() => declaration_1.convert(0, declaration, ""), new Error("test must be >= 1"));
    });
    it("Generates an error if value is too high for a number option with no min", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            maxValue: 10,
            defaultValue: 1,
        };
        assert_1.throws(() => declaration_1.convert(11, declaration, ""), new Error("test must be <= 10"));
    });
    it("Converts to number if value is the highest allowed value for a number option", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 1,
        };
        assert_1.deepStrictEqual(declaration_1.convert(10, declaration, ""), 10);
    });
    it("Generates an error if value is too high for a number option", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 1,
        };
        assert_1.throws(() => declaration_1.convert(11, declaration, ""), new Error("test must be between 1 and 10"));
    });
    it("Validates number options", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Number,
            validate: (value) => {
                if (value % 2 !== 0) {
                    throw new Error("test must be even");
                }
            },
        };
        assert_1.deepStrictEqual(declaration_1.convert(0, declaration, ""), 0);
        assert_1.deepStrictEqual(declaration_1.convert(2, declaration, ""), 2);
        assert_1.deepStrictEqual(declaration_1.convert(4, declaration, ""), 4);
        assert_1.throws(() => declaration_1.convert(1, declaration, ""), new Error("test must be even"));
    });
    it("Converts to strings", () => {
        assert_1.deepStrictEqual(declaration_1.convert("123", optionWithType(declaration_1.ParameterType.String), ""), "123");
        assert_1.deepStrictEqual(declaration_1.convert(123, optionWithType(declaration_1.ParameterType.String), ""), "123");
        assert_1.deepStrictEqual(declaration_1.convert(["1", "2"], optionWithType(declaration_1.ParameterType.String), ""), "1,2");
        assert_1.deepStrictEqual(declaration_1.convert(null, optionWithType(declaration_1.ParameterType.String), ""), "");
        assert_1.deepStrictEqual(declaration_1.convert(void 0, optionWithType(declaration_1.ParameterType.String), ""), "");
    });
    it("Validates string options", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.String,
            validate: (value) => {
                if (value !== value.toUpperCase()) {
                    throw new Error("test must be upper case");
                }
            },
        };
        assert_1.deepStrictEqual(declaration_1.convert("TOASTY", declaration, ""), "TOASTY");
        assert_1.throws(() => declaration_1.convert("toasty", declaration, ""), new Error("test must be upper case"));
    });
    it("Converts to booleans", () => {
        assert_1.deepStrictEqual(declaration_1.convert("a", optionWithType(declaration_1.ParameterType.Boolean), ""), true);
        assert_1.deepStrictEqual(declaration_1.convert([1], optionWithType(declaration_1.ParameterType.Boolean), ""), true);
        assert_1.deepStrictEqual(declaration_1.convert(false, optionWithType(declaration_1.ParameterType.Boolean), ""), false);
    });
    it("Converts to arrays", () => {
        assert_1.deepStrictEqual(declaration_1.convert("12,3", optionWithType(declaration_1.ParameterType.Array), ""), [
            "12,3",
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(["12,3"], optionWithType(declaration_1.ParameterType.Array), ""), [
            "12,3",
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(true, optionWithType(declaration_1.ParameterType.Array), ""), []);
        assert_1.deepStrictEqual(declaration_1.convert("/,a", optionWithType(declaration_1.ParameterType.PathArray), ""), [
            path_1.resolve("/,a"),
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(["/foo"], optionWithType(declaration_1.ParameterType.PathArray), ""), [
            path_1.resolve("/foo"),
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(true, optionWithType(declaration_1.ParameterType.PathArray), ""), []);
        assert_1.deepStrictEqual(declaration_1.convert("a,b", optionWithType(declaration_1.ParameterType.ModuleArray), ""), [
            "a,b",
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(["a,b"], optionWithType(declaration_1.ParameterType.ModuleArray), ""), [
            "a,b",
        ]);
        assert_1.deepStrictEqual(declaration_1.convert(true, optionWithType(declaration_1.ParameterType.ModuleArray), ""), []);
    });
    it("ModuleArray is resolved if relative", () => {
        assert_1.deepStrictEqual(declaration_1.convert(["./foo"], optionWithType(declaration_1.ParameterType.ModuleArray), ""), [path_1.join(process.cwd(), "foo")]);
    });
    it("Validates array options", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Array,
            validate: (value) => {
                if (value.length === 0) {
                    throw new Error("test must not be empty");
                }
            },
        };
        assert_1.deepStrictEqual(declaration_1.convert(["1"], declaration, ""), ["1"]);
        assert_1.deepStrictEqual(declaration_1.convert(["1", "2"], declaration, ""), ["1", "2"]);
        assert_1.throws(() => declaration_1.convert([], declaration, ""), new Error("test must not be empty"));
    });
    it("Converts to mapped types", () => {
        const declaration = {
            name: "",
            help: "",
            type: declaration_1.ParameterType.Map,
            map: {
                a: 1,
                b: 2,
            },
            defaultValue: 1,
        };
        assert_1.deepStrictEqual(declaration_1.convert("a", declaration, ""), 1);
        assert_1.deepStrictEqual(declaration_1.convert("b", declaration, ""), 2);
        assert_1.deepStrictEqual(declaration_1.convert(2, declaration, ""), 2);
    });
    it("Converts to mapped types with a map", () => {
        const declaration = {
            name: "",
            help: "",
            type: declaration_1.ParameterType.Map,
            map: new Map([
                ["a", 1],
                ["b", 2],
            ]),
            defaultValue: 1,
        };
        assert_1.deepStrictEqual(declaration_1.convert("a", declaration, ""), 1);
        assert_1.deepStrictEqual(declaration_1.convert("b", declaration, ""), 2);
        assert_1.deepStrictEqual(declaration_1.convert(2, declaration, ""), 2);
    });
    it("Uses the mapError if provided for errors", () => {
        const declaration = {
            name: "",
            help: "",
            type: declaration_1.ParameterType.Map,
            map: {},
            defaultValue: 1,
            mapError: "Test error",
        };
        assert_1.throws(() => declaration_1.convert("a", declaration, ""), new Error(declaration.mapError));
    });
    it("Generates a nice error if no mapError is provided", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Map,
            map: new Map([
                ["a", 1],
                ["b", 2],
            ]),
            defaultValue: 1,
        };
        assert_1.throws(() => declaration_1.convert("c", declaration, ""), new Error("test must be one of a, b"));
    });
    it("Correctly handles enum types in the map error", () => {
        let Enum;
        (function (Enum) {
            Enum[Enum["a"] = 0] = "a";
            Enum[Enum["b"] = 1] = "b";
        })(Enum || (Enum = {}));
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Map,
            map: Enum,
            defaultValue: Enum.a,
        };
        assert_1.throws(() => declaration_1.convert("c", declaration, ""), new Error("test must be one of a, b"));
    });
    it("Passes through mixed", () => {
        const data = Symbol();
        assert_1.deepStrictEqual(declaration_1.convert(data, optionWithType(declaration_1.ParameterType.Mixed), ""), data);
    });
    it("Validates mixed options", () => {
        const declaration = {
            name: "test",
            help: "",
            type: declaration_1.ParameterType.Mixed,
            defaultValue: "default",
            validate: (value) => {
                if (typeof value === "number") {
                    throw new Error("test must not be a number");
                }
            },
        };
        assert_1.deepStrictEqual(declaration_1.convert("text", declaration, ""), "text");
        assert_1.throws(() => declaration_1.convert(1, declaration, ""), new Error("test must not be a number"));
    });
});
describe("Options - default values", () => {
    function getDeclaration(type, defaultValue) {
        return {
            type,
            defaultValue,
            name: "test",
            help: "",
        };
    }
    it("String", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.String, void 0)), "");
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.String, "foo")), "foo");
    });
    it("Path", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Path, void 0)), "");
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Path, "foo")), path_1.resolve("foo"));
    });
    it("Number", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Number, void 0)), 0);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Number, 123)), 123);
        assert_1.ok(Number.isNaN(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Number, NaN))));
    });
    it("Boolean", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Boolean, void 0)), false);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Boolean, true)), true);
    });
    it("Map", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Map, void 0)), void 0);
        const def = {};
        assert_1.ok(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Map, def)) === def);
    });
    it("Mixed", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Mixed, void 0)), void 0);
        const def = {};
        assert_1.ok(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Mixed, def)) === def);
    });
    it("Array", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Array, void 0)), []);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.Array, ["a"])), [
            "a",
        ]);
    });
    it("PathArray", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.PathArray, void 0)), []);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.PathArray, ["a"])), [
            path_1.resolve("a"),
        ]);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.PathArray, ["/a"])), [path_1.resolve("/a")]);
    });
    it("ModuleArray", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.ModuleArray, void 0)), []);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.ModuleArray, ["a"])), ["a"]);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.ModuleArray, ["./a"])), [path_1.resolve("./a")]);
    });
    it("GlobArray", () => {
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.GlobArray, void 0)), []);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.GlobArray, ["a"])), [
            path_1.resolve("a"),
        ]);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.GlobArray, ["**a"])), ["**a"]);
        assert_1.deepStrictEqual(declaration_1.getDefaultValue(getDeclaration(declaration_1.ParameterType.GlobArray, ["#!a"])), ["#!" + path_1.resolve("a")]);
    });
});
