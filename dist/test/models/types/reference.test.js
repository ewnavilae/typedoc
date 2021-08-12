"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const models_1 = require("../../../lib/models");
const declaration_1 = require("../../../lib/models/reflections/declaration");
const reference_1 = require("../../../lib/models/types/reference");
describe("Reference Type", () => {
    describe("equals", () => {
        var _a;
        const fakeSymbol1 = Symbol();
        const fakeSymbol2 = Symbol();
        const project = new models_1.ProjectReflection("");
        const reflection = new declaration_1.DeclarationReflection("declaration", models_1.ReflectionKind.Function);
        (_a = project.children) !== null && _a !== void 0 ? _a : (project.children = []);
        project.children.push(reflection);
        project.registerReflection(reflection, fakeSymbol1);
        it("types with same target are equal", () => {
            const type1 = new reference_1.ReferenceType("Type", fakeSymbol1, project);
            const type2 = new reference_1.ReferenceType("Type", fakeSymbol1, project);
            assert_1.deepStrictEqual(type1.equals(type2), true);
        });
        it("unresolved types with same target are equal", () => {
            const type1 = new reference_1.ReferenceType("Type", fakeSymbol2, project);
            const type2 = new reference_1.ReferenceType("Type", fakeSymbol2, project);
            assert_1.deepStrictEqual(type1.equals(type2), true);
        });
        it("types with different targets are not equal", () => {
            const type1 = new reference_1.ReferenceType("Type1", fakeSymbol1, project);
            const type2 = new reference_1.ReferenceType("Type2", fakeSymbol2, project);
            assert_1.deepStrictEqual(type1.equals(type2), false);
        });
        it("types with same resolved target are equal", () => {
            const type1 = new reference_1.ReferenceType("Type1", reflection, project);
            const type2 = new reference_1.ReferenceType("Type2", fakeSymbol1, project);
            assert_1.deepStrictEqual(type1.equals(type2), true);
        });
        it("types with the same type parameters are equal", () => {
            const type1 = new reference_1.ReferenceType("Type1", reflection, project);
            type1.typeArguments = [new models_1.LiteralType(null)];
            const type2 = new reference_1.ReferenceType("Type2", fakeSymbol1, project);
            type2.typeArguments = [new models_1.LiteralType(null)];
            assert_1.deepStrictEqual(type1.equals(type2), true);
        });
        it("types with different type parameters are not equal", () => {
            const type1 = new reference_1.ReferenceType("Type1", reflection, project);
            type1.typeArguments = [new models_1.LiteralType(null)];
            const type2 = new reference_1.ReferenceType("Type2", fakeSymbol1, project);
            assert_1.deepStrictEqual(type1.equals(type2), false);
        });
        it("intentionally broken reference types with different names are not equal", () => {
            const type1 = reference_1.ReferenceType.createBrokenReference("Type1", project);
            const type2 = reference_1.ReferenceType.createBrokenReference("Type2", project);
            assert_1.deepStrictEqual(type1.equals(type2), false);
        });
    });
});
