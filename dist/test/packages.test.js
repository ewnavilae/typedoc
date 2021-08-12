"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const fs_1 = require("fs");
const path_1 = require("path");
const utils_1 = require("../lib/utils");
const package_manifest_1 = require("../lib/utils/package-manifest");
describe("Packages support", () => {
    it("handles monorepos", () => {
        const base = path_1.join(__dirname, "packages", "multi-package");
        const logger = new utils_1.Logger();
        const packages = package_manifest_1.expandPackages(logger, ".", [base]);
        assert_1.deepStrictEqual(packages, [
            path_1.join(base, "packages/bar"),
            path_1.join(base, "packages/baz"),
            path_1.join(base, "packages/foo"),
        ].map(utils_1.normalizePath));
        const entries = packages.map((p) => {
            const packageJson = path_1.join(p, "package.json");
            return package_manifest_1.getTsEntryPointForPackage(logger, packageJson, JSON.parse(fs_1.readFileSync(packageJson, "utf-8")));
        });
        assert_1.deepStrictEqual(entries, [
            path_1.join(base, "packages/bar/index.d.ts"),
            path_1.join(base, "packages/baz/index.ts"),
            path_1.join(base, "packages/foo/index.ts"),
        ]);
        assert_1.ok(!logger.hasErrors() && !logger.hasWarnings());
    });
    it("handles single packages", () => {
        const base = path_1.join(__dirname, "packages", "single-package");
        const logger = new utils_1.Logger();
        const packages = package_manifest_1.expandPackages(logger, ".", [base]);
        assert_1.deepStrictEqual(packages, [utils_1.normalizePath(base)]);
    });
});
