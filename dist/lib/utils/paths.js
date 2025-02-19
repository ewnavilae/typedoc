"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesAny = exports.createMinimatch = void 0;
const minimatch_1 = require("minimatch");
const fs_1 = require("./fs");
/**
 * Convert array of glob patterns to array of minimatch instances.
 *
 * Handle a few Windows-Unix path gotchas.
 */
function createMinimatch(patterns) {
    return patterns.map((pattern) => new minimatch_1.Minimatch(fs_1.normalizePath(pattern).replace(/^\w:\//, ""), {
        dot: true,
    }));
}
exports.createMinimatch = createMinimatch;
function matchesAny(patterns, path) {
    const normPath = fs_1.normalizePath(path).replace(/^\w:\//, "");
    return patterns.some((pat) => pat.match(normPath));
}
exports.matchesAny = matchesAny;
