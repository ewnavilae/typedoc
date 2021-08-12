"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const models_1 = require("../../lib/models");
const abstract_1 = require("../../lib/models/reflections/abstract");
const utils_1 = require("../../lib/utils");
describe("Sort", () => {
    it("Should sort by name", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.TypeAlias),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.TypeAlias),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.TypeAlias),
        ];
        utils_1.sortReflections(arr, ["alphabetical"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["a", "b", "c"]);
    });
    it("Should sort by enum value ascending", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.EnumMember),
        ];
        arr[0].defaultValue = "123";
        arr[1].defaultValue = "12";
        arr[2].defaultValue = "3";
        utils_1.sortReflections(arr, ["enum-value-ascending"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["c", "b", "a"]);
    });
    it("Should not sort enum value ascending if not an enum member", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.EnumMember),
        ];
        arr[0].defaultValue = "123";
        arr[1].defaultValue = "12";
        arr[2].defaultValue = "3";
        utils_1.sortReflections(arr, ["enum-value-ascending"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["a", "c", "b"]);
    });
    it("Should sort by enum value descending", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.EnumMember),
        ];
        arr[0].defaultValue = "123";
        arr[1].defaultValue = "12";
        arr[2].defaultValue = "3";
        utils_1.sortReflections(arr, ["enum-value-descending"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["a", "b", "c"]);
    });
    it("Should not sort enum value descending if not an enum member", () => {
        const arr = [
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.EnumMember),
        ];
        arr[0].defaultValue = "123";
        arr[1].defaultValue = "-1";
        arr[2].defaultValue = "3";
        utils_1.sortReflections(arr, ["enum-value-descending"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["c", "b", "a"]);
    });
    it("Should sort by static first", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.Function),
        ];
        arr[0].setFlag(models_1.ReflectionFlag.Static, true);
        arr[1].setFlag(models_1.ReflectionFlag.Static, false);
        arr[2].setFlag(models_1.ReflectionFlag.Static, true);
        utils_1.sortReflections(arr, ["static-first"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["a", "c", "b"]);
    });
    it("Should sort by instance first", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.Function),
        ];
        arr[0].setFlag(models_1.ReflectionFlag.Static, true);
        arr[1].setFlag(models_1.ReflectionFlag.Static, false);
        arr[2].setFlag(models_1.ReflectionFlag.Static, true);
        utils_1.sortReflections(arr, ["instance-first"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["b", "a", "c"]);
    });
    it("Should sort by visibility", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("c", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("d", models_1.ReflectionKind.Function),
        ];
        arr[0].setFlag(models_1.ReflectionFlag.Protected, true);
        arr[1].setFlag(models_1.ReflectionFlag.Private, true);
        arr[2].setFlag(models_1.ReflectionFlag.Public, true);
        // This might not be set. If not set, assumed public.
        // arr[3].setFlag(ReflectionFlag.Public, true);
        utils_1.sortReflections(arr, ["visibility"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["c", "d", "a", "b"]);
    });
    it("Should sort by required/optional", () => {
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Property),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Property),
        ];
        arr[0].setFlag(models_1.ReflectionFlag.Optional, true);
        arr[1].setFlag(models_1.ReflectionFlag.Optional, false);
        utils_1.sortReflections(arr, ["required-first"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["b", "a"]);
    });
    it("Should sort by kind", () => {
        const arr = [
            new models_1.DeclarationReflection("1", models_1.ReflectionKind.Reference),
            new models_1.DeclarationReflection("25", models_1.ReflectionKind.SetSignature),
            new models_1.DeclarationReflection("3", models_1.ReflectionKind.Module),
            new models_1.DeclarationReflection("4", models_1.ReflectionKind.Namespace),
            new models_1.DeclarationReflection("5", models_1.ReflectionKind.Enum),
            new models_1.DeclarationReflection("6", models_1.ReflectionKind.EnumMember),
            new models_1.DeclarationReflection("16", models_1.ReflectionKind.Method),
            new models_1.DeclarationReflection("8", models_1.ReflectionKind.Interface),
            new models_1.DeclarationReflection("9", models_1.ReflectionKind.TypeAlias),
            new models_1.DeclarationReflection("10", models_1.ReflectionKind.Constructor),
            new models_1.DeclarationReflection("11", models_1.ReflectionKind.Event),
            new models_1.DeclarationReflection("2", models_1.ReflectionKind.Project),
            new models_1.DeclarationReflection("24", models_1.ReflectionKind.GetSignature),
            new models_1.DeclarationReflection("13", models_1.ReflectionKind.Variable),
            new models_1.DeclarationReflection("14", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("15", models_1.ReflectionKind.Accessor),
            new models_1.DeclarationReflection("12", models_1.ReflectionKind.Property),
            new models_1.DeclarationReflection("20", models_1.ReflectionKind.TypeLiteral),
            new models_1.DeclarationReflection("17", models_1.ReflectionKind.ObjectLiteral),
            new models_1.DeclarationReflection("18", models_1.ReflectionKind.Parameter),
            new models_1.DeclarationReflection("19", models_1.ReflectionKind.TypeParameter),
            new models_1.DeclarationReflection("21", models_1.ReflectionKind.CallSignature),
            new models_1.DeclarationReflection("7", models_1.ReflectionKind.Class),
            new models_1.DeclarationReflection("22", models_1.ReflectionKind.ConstructorSignature),
            new models_1.DeclarationReflection("23", models_1.ReflectionKind.IndexSignature),
        ];
        utils_1.sortReflections(arr, ["kind"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), Array.from({ length: arr.length }, (_, i) => (i + 1).toString()));
    });
    it("Should sort with multiple strategies", () => {
        abstract_1.resetReflectionID();
        const arr = [
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function),
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function),
        ];
        arr[0].setFlag(models_1.ReflectionFlag.Optional, true);
        arr[2].setFlag(models_1.ReflectionFlag.Optional, true);
        utils_1.sortReflections(arr, ["required-first", "alphabetical"]);
        assert_1.deepStrictEqual(arr.map((r) => r.id), [1, 3, 0, 2]);
    });
    it("source-order should do nothing if no symbols are available", () => {
        const proj = new models_1.ProjectReflection("");
        const arr = [
            new models_1.DeclarationReflection("b", models_1.ReflectionKind.Function, proj),
            new models_1.DeclarationReflection("a", models_1.ReflectionKind.Function, proj),
        ];
        utils_1.sortReflections(arr, ["source-order", "alphabetical"]);
        assert_1.deepStrictEqual(arr.map((r) => r.name), ["a", "b"]);
    });
});
