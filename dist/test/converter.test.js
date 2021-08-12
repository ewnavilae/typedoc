"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const FS = require("fs");
const Path = require("path");
const assert_1 = require("assert");
const ts = require("typescript");
const options_1 = require("../lib/utils/options");
describe("Converter", function () {
    const base = Path.join(__dirname, "converter");
    const app = new __1.Application();
    app.options.addReader(new options_1.TSConfigReader());
    app.bootstrap({
        logger: "none",
        name: "typedoc",
        excludeExternals: true,
        disableSources: true,
        tsconfig: Path.join(base, "tsconfig.json"),
        externalPattern: ["**/node_modules/**"],
        plugin: [],
    });
    let program;
    it("Compiles", () => {
        program = ts.createProgram(app.options.getFileNames(), {
            ...app.options.getCompilerOptions(),
            noEmit: true,
        });
        const errors = ts.getPreEmitDiagnostics(program);
        assert_1.deepStrictEqual(errors, []);
    });
    const checks = [
        [
            "specs",
            () => {
                // nop
            },
            () => {
                // nop
            },
        ],
        [
            "specs-with-lump-categories",
            () => app.options.setValue("categorizeByGroup", false),
            () => app.options.setValue("categorizeByGroup", true),
        ],
        [
            "specs.nodoc",
            () => app.options.setValue("excludeNotDocumented", true),
            () => app.options.setValue("excludeNotDocumented", false),
        ],
    ];
    FS.readdirSync(base).forEach(function (directory) {
        const path = Path.join(base, directory);
        if (!FS.lstatSync(path).isDirectory()) {
            return;
        }
        describe(directory, function () {
            for (const [file, before, after] of checks) {
                const specsFile = Path.join(path, `${file}.json`);
                if (!FS.existsSync(specsFile)) {
                    continue;
                }
                let result;
                it(`[${file}] converts fixtures`, function () {
                    before();
                    __1.resetReflectionID();
                    result = app.converter.convert(app.getEntryPointsForPaths([path], [program]));
                    after();
                    assert_1.ok(result instanceof __1.ProjectReflection, "No reflection returned");
                });
                it(`[${file}] matches specs`, function () {
                    const specs = JSON.parse(FS.readFileSync(specsFile, "utf-8"));
                    let data = JSON.stringify(app.serializer.toObject(result), null, "  ");
                    data = data.split(__1.normalizePath(base)).join("%BASE%");
                    assert_1.deepStrictEqual(JSON.parse(data), specs);
                });
            }
        });
    });
});
