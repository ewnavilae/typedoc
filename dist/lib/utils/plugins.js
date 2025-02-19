"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverNpmPlugins = exports.loadPlugins = void 0;
const FS = require("fs");
const Path = require("path");
function loadPlugins(app, plugins) {
    if (plugins.includes("none")) {
        return;
    }
    for (const plugin of plugins) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const instance = require(plugin);
            let initFunction = instance.load;
            if (typeof initFunction !== "function" &&
                typeof instance === "function") {
                app.logger.deprecated(`${plugin} uses a deprecated structure. Plugins should export a "load" function to be called with the Application`);
                initFunction = instance;
            }
            if (typeof initFunction === "function") {
                initFunction(app);
                app.logger.info(`Loaded plugin ${plugin}`);
            }
            else {
                app.logger.error(`Invalid structure in plugin ${plugin}, no load function found.`);
            }
        }
        catch (error) {
            app.logger.error(`The plugin ${plugin} could not be loaded.`);
            app.logger.error(error.stack);
        }
    }
}
exports.loadPlugins = loadPlugins;
function discoverNpmPlugins(app) {
    const result = [];
    discover();
    return result;
    /**
     * Find all parent folders containing a `node_modules` subdirectory.
     */
    function discover() {
        let path = process.cwd();
        let previous;
        do {
            const modules = Path.join(path, "node_modules");
            if (FS.existsSync(modules) && FS.statSync(modules).isDirectory()) {
                discoverModules(modules);
            }
            previous = path;
            path = Path.resolve(Path.join(previous, ".."));
        } while (previous !== path);
    }
    /**
     * Scan the given `node_modules` directory for TypeDoc plugins.
     */
    function discoverModules(basePath) {
        const candidates = [];
        FS.readdirSync(basePath).forEach((name) => {
            const dir = Path.join(basePath, name);
            if (name.startsWith("@") && FS.statSync(dir).isDirectory()) {
                FS.readdirSync(dir).forEach((n) => {
                    candidates.push(Path.join(name, n));
                });
            }
            candidates.push(name);
        });
        candidates.forEach((name) => {
            const infoFile = Path.join(basePath, name, "package.json");
            if (!FS.existsSync(infoFile)) {
                return;
            }
            const info = loadPackageInfo(app.logger, infoFile);
            if (isPlugin(info)) {
                result.push(Path.join(basePath, name));
            }
        });
    }
}
exports.discoverNpmPlugins = discoverNpmPlugins;
/**
 * Load and parse the given `package.json`.
 */
function loadPackageInfo(logger, fileName) {
    try {
        return require(fileName);
    }
    catch (_a) {
        logger.error(`Could not parse ${fileName}`);
        return {};
    }
}
/**
 * Test whether the given package info describes a TypeDoc plugin.
 */
function isPlugin(info) {
    if (typeof info !== "object" || !info) {
        return false;
    }
    const keywords = info.keywords;
    if (!keywords || !Array.isArray(keywords)) {
        return false;
    }
    return keywords.some((keyword) => typeof keyword === "string" &&
        keyword.toLocaleLowerCase() === "typedocplugin");
}
