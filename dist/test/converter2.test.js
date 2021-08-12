"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const __1 = require("..");
const ts = require("typescript");
const assert_1 = require("assert");
const models_1 = require("../lib/models");
function query(project, name) {
    const reflection = project.getChildByName(name);
    assert_1.ok(reflection instanceof models_1.DeclarationReflection, `Failed to find ${name}`);
    return reflection;
}
const issueTests = {
    gh869(project) {
        var _a, _b, _c, _d;
        const classFoo = (_a = project.children) === null || _a === void 0 ? void 0 : _a.find((r) => r.name === "Foo" && r.kind === models_1.ReflectionKind.Class);
        assert_1.ok(classFoo instanceof models_1.DeclarationReflection);
        assert_1.deepStrictEqual((_b = classFoo.children) === null || _b === void 0 ? void 0 : _b.find((r) => r.name === "x"), undefined);
        const nsFoo = (_c = project.children) === null || _c === void 0 ? void 0 : _c.find((r) => r.name === "Foo" && r.kind === models_1.ReflectionKind.Namespace);
        assert_1.ok(nsFoo instanceof models_1.DeclarationReflection);
        assert_1.ok((_d = nsFoo.children) === null || _d === void 0 ? void 0 : _d.find((r) => r.name === "x"));
    },
    gh1124(project) {
        var _a;
        assert_1.deepStrictEqual((_a = project.children) === null || _a === void 0 ? void 0 : _a.length, 1, "Namespace with type and value converted twice");
    },
    gh1150(project) {
        var _a;
        const refl = query(project, "IntersectFirst");
        assert_1.deepStrictEqual(refl === null || refl === void 0 ? void 0 : refl.kind, models_1.ReflectionKind.TypeAlias);
        assert_1.deepStrictEqual((_a = refl.type) === null || _a === void 0 ? void 0 : _a.type, "indexedAccess");
    },
    gh1164(project) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const refl = query(project, "gh1164");
        assert_1.deepStrictEqual((_e = (_d = (_c = (_b = (_a = refl.signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.parameters) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.comment) === null || _e === void 0 ? void 0 : _e.text, "{@link CommentedClass} Test description.");
        assert_1.deepStrictEqual((_h = (_g = (_f = refl.signatures) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.comment) === null || _h === void 0 ? void 0 : _h.returns, "Test description.\n");
    },
    gh1215(project) {
        var _a;
        const foo = query(project, "Foo.bar");
        assert_1.ok(foo.setSignature instanceof models_1.SignatureReflection);
        assert_1.deepStrictEqual((_a = foo.setSignature.type) === null || _a === void 0 ? void 0 : _a.toString(), "void");
    },
    gh1255(project) {
        var _a;
        const foo = query(project, "C.foo");
        assert_1.deepStrictEqual((_a = foo.comment) === null || _a === void 0 ? void 0 : _a.shortText, "Docs!");
    },
    gh1330(project) {
        var _a;
        const example = query(project, "ExampleParam");
        assert_1.deepStrictEqual((_a = example === null || example === void 0 ? void 0 : example.type) === null || _a === void 0 ? void 0 : _a.type, "reference");
        assert_1.deepStrictEqual(example.type.toString(), "Example");
    },
    gh1366(project) {
        const foo = query(project, "GH1366.Foo");
        assert_1.deepStrictEqual(foo.kind, models_1.ReflectionKind.Reference);
    },
    gh1408(project) {
        var _a, _b, _c;
        const foo = query(project, "foo");
        const type = (_c = (_b = (_a = foo === null || foo === void 0 ? void 0 : foo.signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.typeParameters) === null || _c === void 0 ? void 0 : _c[0].type;
        assert_1.deepStrictEqual(type === null || type === void 0 ? void 0 : type.type, "array");
        assert_1.deepStrictEqual(type === null || type === void 0 ? void 0 : type.toString(), "unknown[]");
    },
    gh1436(project) {
        var _a;
        assert_1.deepStrictEqual((_a = project.children) === null || _a === void 0 ? void 0 : _a.map((c) => c.name), ["gh1436"]);
    },
    gh1449(project) {
        var _a, _b, _c;
        const refl = (_a = query(project, "gh1449").signatures) === null || _a === void 0 ? void 0 : _a[0];
        assert_1.deepStrictEqual((_c = (_b = refl === null || refl === void 0 ? void 0 : refl.typeParameters) === null || _b === void 0 ? void 0 : _b[0].type) === null || _c === void 0 ? void 0 : _c.toString(), "[foo: any, bar?: any]");
    },
    gh1454(project) {
        var _a, _b, _c, _d;
        const foo = query(project, "foo");
        const fooRet = (_b = (_a = foo === null || foo === void 0 ? void 0 : foo.signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.type;
        assert_1.deepStrictEqual(fooRet === null || fooRet === void 0 ? void 0 : fooRet.type, "reference");
        assert_1.deepStrictEqual(fooRet === null || fooRet === void 0 ? void 0 : fooRet.toString(), "Foo");
        const bar = query(project, "bar");
        const barRet = (_d = (_c = bar === null || bar === void 0 ? void 0 : bar.signatures) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.type;
        assert_1.deepStrictEqual(barRet === null || barRet === void 0 ? void 0 : barRet.type, "reference");
        assert_1.deepStrictEqual(barRet === null || barRet === void 0 ? void 0 : barRet.toString(), "Bar");
    },
    gh1462(project) {
        var _a, _b, _c, _d;
        const prop = query(project, "PROP");
        assert_1.deepStrictEqual((_a = prop.type) === null || _a === void 0 ? void 0 : _a.toString(), "number");
        // Would be nice to get this to work someday
        assert_1.deepStrictEqual((_b = prop.comment) === null || _b === void 0 ? void 0 : _b.shortText, void 0);
        const method = query(project, "METHOD");
        assert_1.deepStrictEqual((_d = (_c = method.signatures) === null || _c === void 0 ? void 0 : _c[0].comment) === null || _d === void 0 ? void 0 : _d.shortText, "method docs");
    },
    gh1481(project) {
        var _a, _b, _c;
        const signature = (_a = query(project, "GH1481.static").signatures) === null || _a === void 0 ? void 0 : _a[0];
        assert_1.deepStrictEqual((_b = signature === null || signature === void 0 ? void 0 : signature.comment) === null || _b === void 0 ? void 0 : _b.shortText, "static docs");
        assert_1.deepStrictEqual((_c = signature === null || signature === void 0 ? void 0 : signature.type) === null || _c === void 0 ? void 0 : _c.toString(), "void");
    },
    gh1483(project) {
        assert_1.deepStrictEqual(query(project, "gh1483.namespaceExport").kind, models_1.ReflectionKind.Function);
        assert_1.deepStrictEqual(query(project, "gh1483_2.staticMethod").kind, models_1.ReflectionKind.Method);
    },
    gh1490(project) {
        var _a, _b, _c;
        const refl = query(project, "GH1490.optionalMethod");
        assert_1.deepStrictEqual((_c = (_b = (_a = refl.signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.comment) === null || _c === void 0 ? void 0 : _c.shortText, "With comment");
    },
    gh1509(project) {
        const pFoo = query(project, "PartialFoo.foo");
        assert_1.deepStrictEqual(pFoo.flags.isOptional, true);
        const rFoo = query(project, "ReadonlyFoo.foo");
        assert_1.deepStrictEqual(rFoo.flags.isReadonly, true);
        assert_1.deepStrictEqual(rFoo.flags.isOptional, true);
    },
    gh1514(project) {
        // Not ideal. Really we want to handle these names nicer...
        query(project, "ComputedUniqueName.[UNIQUE_SYMBOL]");
    },
    gh1522(project) {
        var _a;
        assert_1.deepStrictEqual((_a = project.groups) === null || _a === void 0 ? void 0 : _a.map((g) => { var _a; return (_a = g.categories) === null || _a === void 0 ? void 0 : _a.map((c) => c.title); }), [["cat"]]);
    },
    gh1524(project) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const nullableParam = (_c = (_b = (_a = query(project, "nullable").signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.parameters) === null || _c === void 0 ? void 0 : _c[0];
        assert_1.deepStrictEqual((_d = nullableParam === null || nullableParam === void 0 ? void 0 : nullableParam.type) === null || _d === void 0 ? void 0 : _d.toString(), "string | null");
        const nonNullableParam = (_g = (_f = (_e = query(project, "nonNullable").signatures) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.parameters) === null || _g === void 0 ? void 0 : _g[0];
        assert_1.deepStrictEqual((_h = nonNullableParam === null || nonNullableParam === void 0 ? void 0 : nonNullableParam.type) === null || _h === void 0 ? void 0 : _h.toString(), "string");
    },
    gh1534(project) {
        var _a, _b, _c, _d, _e;
        const func = query(project, "gh1534");
        assert_1.deepStrictEqual((_e = (_d = (_c = (_b = (_a = func.signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.parameters) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.type) === null || _e === void 0 ? void 0 : _e.toString(), "readonly [number, string]");
    },
    gh1547(project) {
        var _a;
        assert_1.deepStrictEqual((_a = project.children) === null || _a === void 0 ? void 0 : _a.map((c) => c.name), ["Test", "ThingA", "ThingB"]);
    },
    gh1552(project) {
        assert_1.deepStrictEqual(query(project, "emptyArr").defaultValue, "[]");
        assert_1.deepStrictEqual(query(project, "nonEmptyArr").defaultValue, "...");
        assert_1.deepStrictEqual(query(project, "emptyObj").defaultValue, "{}");
        assert_1.deepStrictEqual(query(project, "nonEmptyObj").defaultValue, "...");
    },
    gh1578(project) {
        assert_1.ok(query(project, "notIgnored"));
        assert_1.ok(!project.findReflectionByName("ignored"), "Symbol re-exported from ignored file is ignored.");
    },
    gh1580(project) {
        var _a, _b;
        assert_1.ok(query(project, "B.prop").hasComment(), "Overwritten property with no comment should be inherited");
        assert_1.ok((_b = (_a = query(project, "B.run").signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.hasComment(), "Overwritten method with no comment should be inherited");
    },
    gh1624(project) {
        var _a, _b;
        assert_1.ok((_b = (_a = query(project, "Foo.baz").signatures) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.hasComment(), "Property methods declared in interface should still allow comment inheritance");
    },
    gh1626(project) {
        var _a, _b, _c, _d;
        const ctor = query(project, "Foo.constructor");
        assert_1.deepStrictEqual((_b = (_a = ctor.sources) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.line, 2);
        assert_1.deepStrictEqual((_d = (_c = ctor.sources) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.character, 4);
    },
};
describe("Converter2", () => {
    const base = path_1.join(__dirname, "converter2");
    const app = new __1.Application();
    app.options.addReader(new __1.TSConfigReader());
    app.bootstrap({
        name: "typedoc",
        excludeExternals: true,
        tsconfig: path_1.join(base, "tsconfig.json"),
        plugin: [],
    });
    app.options.freeze();
    let program;
    before("Compiles", () => {
        program = ts.createProgram(app.options.getFileNames(), {
            ...app.options.getCompilerOptions(),
            noEmit: true,
        });
        const errors = ts.getPreEmitDiagnostics(program);
        app.logger.diagnostics(errors);
        assert_1.deepStrictEqual(errors.length, 0);
    });
    for (const [entry, check] of Object.entries(issueTests)) {
        const link = `https://github.com/TypeStrong/typedoc/issues/${entry.substr(2)}`;
        it(`Issue ${entry.substr(2).padEnd(4)} (${link})`, () => {
            const entryPoint = [
                path_1.join(base, "issues", `${entry}.ts`),
                path_1.join(base, "issues", `${entry}.d.ts`),
                path_1.join(base, "issues", `${entry}.tsx`),
                path_1.join(base, "issues", `${entry}.js`),
                path_1.join(base, "issues", entry, "index.ts"),
            ].find(fs_1.existsSync);
            assert_1.ok(entryPoint, `No entry point found for ${entry}`);
            const sourceFile = program.getSourceFile(entryPoint);
            assert_1.ok(sourceFile, `No source file found for ${entryPoint}`);
            const project = app.converter.convert([
                {
                    displayName: entry,
                    path: entryPoint,
                    program,
                    sourceFile,
                },
            ]);
            check(project);
        });
    }
});
