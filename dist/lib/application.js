"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Application_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const Path = require("path");
const FS = require("fs");
const ts = require("typescript");
const index_1 = require("./converter/index");
const renderer_1 = require("./output/renderer");
const serialization_1 = require("./serialization");
const fs_1 = require("./utils/fs");
const index_2 = require("./utils/index");
const paths_1 = require("./utils/paths");
const component_1 = require("./utils/component");
const utils_1 = require("./utils");
const array_1 = require("./utils/array");
const path_1 = require("path");
const package_manifest_1 = require("./utils/package-manifest");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo = require("../../package.json");
const supportedVersionMajorMinor = packageInfo.peerDependencies.typescript
    .split("||")
    .map((version) => version.replace(/^\s*|\.x\s*$/g, ""));
/**
 * Expand the provided packages configuration paths, determining the entry points
 * and creating the ts.Programs for any which are found.
 * @param logger
 * @param packageGlobPaths
 * @returns The information about the discovered programs, undefined if an error occurs.
 */
function getEntryPointsForPackages(logger, packageGlobPaths, willEmit) {
    const results = new Array();
    // --packages arguments are workspace tree roots, or glob patterns
    // This expands them to leave only leaf packages
    const expandedPackages = package_manifest_1.expandPackages(logger, ".", packageGlobPaths);
    for (const packagePath of expandedPackages) {
        const packageJsonPath = path_1.resolve(packagePath, "package.json");
        const packageJson = package_manifest_1.loadPackageManifest(logger, packageJsonPath);
        if (packageJson === undefined) {
            logger.error(`Could not load package manifest ${packageJsonPath}`);
            return;
        }
        const packageEntryPoint = package_manifest_1.getTsEntryPointForPackage(logger, packageJsonPath, packageJson);
        if (packageEntryPoint === undefined) {
            logger.error(`Could not determine TS entry point for package ${packageJsonPath}`);
            return;
        }
        if (packageEntryPoint === package_manifest_1.ignorePackage) {
            continue;
        }
        const tsconfigFile = ts.findConfigFile(packageEntryPoint, ts.sys.fileExists);
        if (tsconfigFile === undefined) {
            logger.error(`Could not determine tsconfig.json for source file ${packageEntryPoint} (it must be on an ancestor path)`);
            return;
        }
        // Consider deduplicating this with similar code in src/lib/utils/options/readers/tsconfig.ts
        let fatalError = false;
        const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(tsconfigFile, {}, {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: (error) => {
                logger.diagnostic(error);
                fatalError = true;
            },
        });
        if (!parsedCommandLine) {
            return;
        }
        logger.diagnostics(parsedCommandLine.errors);
        if (fatalError) {
            return;
        }
        const program = ts.createProgram({
            rootNames: parsedCommandLine.fileNames,
            options: fixCompilerOptions(parsedCommandLine.options, willEmit),
        });
        const sourceFile = program.getSourceFile(packageEntryPoint);
        if (sourceFile === undefined) {
            logger.error(`Entry point "${packageEntryPoint}" does not appear to be built by the tsconfig found at "${tsconfigFile}"`);
            return;
        }
        results.push({
            displayName: packageJson["name"],
            path: packageEntryPoint,
            program,
            sourceFile,
        });
    }
    return results;
}
function fixCompilerOptions(options, willEmit) {
    return {
        ...options,
        noEmit: willEmit === false,
    };
}
function getModuleName(fileName, baseDir) {
    return index_2.normalizePath(Path.relative(baseDir, fileName)).replace(/(\/index)?(\.d)?\.[tj]sx?$/, "");
}
/**
 * The default TypeDoc main application class.
 *
 * This class holds the two main components of TypeDoc, the [[Converter]] and
 * the [[Renderer]]. When running TypeDoc, first the [[Converter]] is invoked which
 * generates a [[ProjectReflection]] from the passed in source files. The
 * [[ProjectReflection]] is a hierarchical model representation of the TypeScript
 * project. Afterwards the model is passed to the [[Renderer]] which uses an instance
 * of [[BaseTheme]] to generate the final documentation.
 *
 * Both the [[Converter]] and the [[Renderer]] are subclasses of the [[AbstractComponent]]
 * and emit a series of events while processing the project. Subscribe to these Events
 * to control the application flow or alter the output.
 */
let Application = Application_1 = class Application extends component_1.ChildableComponent {
    /**
     * Create a new TypeDoc application instance.
     *
     * @param options An object containing the options that should be used.
     */
    constructor() {
        super(component_1.DUMMY_APPLICATION_OWNER);
        this.logger = new index_2.ConsoleLogger();
        this.options = new utils_1.Options(this.logger);
        this.options.addDefaultDeclarations();
        this.serializer = new serialization_1.Serializer();
        this.converter = this.addComponent("converter", index_1.Converter);
        this.renderer = this.addComponent("renderer", renderer_1.Renderer);
    }
    /**
     * Initialize TypeDoc with the given options object.
     *
     * @param options  The desired options to set.
     */
    bootstrap(options = {}) {
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key, val);
            }
            catch (_a) {
                // Ignore errors, plugins haven't been loaded yet and may declare an option.
            }
        }
        this.options.read(new index_2.Logger());
        const logger = this.loggerType;
        if (typeof logger === "function") {
            this.logger = new index_2.CallbackLogger(logger);
            this.options.setLogger(this.logger);
        }
        else if (logger === "none") {
            this.logger = new index_2.Logger();
            this.options.setLogger(this.logger);
        }
        this.logger.level = this.options.getValue("logLevel");
        const plugins = this.options.isSet("plugin")
            ? this.options.getValue("plugin")
            : index_2.discoverNpmPlugins(this);
        index_2.loadPlugins(this, plugins);
        this.options.reset();
        for (const [key, val] of Object.entries(options)) {
            try {
                this.options.setValue(key, val);
            }
            catch (error) {
                this.logger.error(error.message);
            }
        }
        this.options.read(this.logger);
    }
    /**
     * Return the application / root component instance.
     */
    get application() {
        this.logger.deprecated("Application.application is deprecated. Plugins are now passed the application instance when loaded.");
        return this;
    }
    /**
     * Return the path to the TypeScript compiler.
     */
    getTypeScriptPath() {
        return Path.dirname(require.resolve("typescript"));
    }
    getTypeScriptVersion() {
        return ts.version;
    }
    /**
     * Run the converter for the given set of files and return the generated reflections.
     *
     * @returns An instance of ProjectReflection on success, undefined otherwise.
     */
    convert() {
        // We seal here rather than in the Converter class since TypeDoc's tests reuse the Application
        // with a few different settings.
        this.options.freeze();
        this.logger.verbose(`Using TypeScript ${this.getTypeScriptVersion()} from ${this.getTypeScriptPath()}`);
        if (!supportedVersionMajorMinor.some((version) => version == ts.versionMajorMinor)) {
            this.logger.warn(`You are running with an unsupported TypeScript version! TypeDoc supports ${supportedVersionMajorMinor.join(", ")}`);
        }
        if (Object.keys(this.options.getCompilerOptions()).length === 0 &&
            this.options.getValue("packages").length === 0) {
            this.logger.warn(`No compiler options set. This likely means that TypeDoc did not find your tsconfig.json. Generated documentation will probably be empty.`);
        }
        if (this.options.getValue("packages").length &&
            this.entryPoints.length) {
            this.logger.error(`Providing both 'packages' and 'entryPoints' is not supported.`);
            return;
        }
        const packages = this.options.getValue("packages").map(index_2.normalizePath);
        const entryPoints = getEntryPointsForPackages(this.logger, packages, this.emit);
        if (entryPoints === undefined) {
            return;
        }
        if (entryPoints.length === 0) {
            // No package entry points were specified. Try to process the file-oriented entry points.
            // The reason this is skipped when using --packages is that this approach currently assumes a global
            // tsconfig compilation setup which is not likely to exist when using --packages.
            entryPoints.push(...this.getEntryPointsForPaths(this.entryPoints));
        }
        const programs = new Set(entryPoints.map((e) => e.program));
        this.logger.verbose(`Converting with ${programs.size} programs and ${entryPoints.length} entry points`);
        const errors = array_1.flatMap([...programs], ts.getPreEmitDiagnostics);
        if (errors.length) {
            this.logger.diagnostics(errors);
            // return;
        }
        if (this.options.getValue("emit")) {
            for (const program of programs) {
                program.emit();
            }
        }
        return this.converter.convert(entryPoints);
    }
    convertAndWatch(success) {
        var _a, _b, _c;
        this.options.freeze();
        if (!this.options.getValue("preserveWatchOutput") &&
            this.logger instanceof index_2.ConsoleLogger) {
            (_b = (_a = ts.sys).clearScreen) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        this.logger.verbose(`Using TypeScript ${this.getTypeScriptVersion()} from ${this.getTypeScriptPath()}`);
        if (!supportedVersionMajorMinor.some((version) => version == ts.versionMajorMinor)) {
            this.logger.warn(`You are running with an unsupported TypeScript version! TypeDoc supports ${supportedVersionMajorMinor.join(", ")}`);
        }
        if (Object.keys(this.options.getCompilerOptions()).length === 0) {
            this.logger.warn(`No compiler options set. This likely means that TypeDoc did not find your tsconfig.json. Generated documentation will probably be empty.`);
        }
        // Doing this is considerably more complicated, we'd need to manage an array of programs, not convert until all programs
        // have reported in the first time... just error out for now. I'm not convinced anyone will actually notice.
        if (this.options.getFileNames().length === 0) {
            this.logger.error("The provided tsconfig file looks like a solution style tsconfig, which is not supported in watch mode.");
            return;
        }
        // Support for packages mode is currently unimplemented
        if (this.options.getValue("packages").length !== 0) {
            this.logger.error('Running with "--packages" is not supported in watch mode.');
            return;
        }
        // Matches the behavior of the tsconfig option reader.
        let tsconfigFile = this.options.getValue("tsconfig");
        tsconfigFile =
            (_c = ts.findConfigFile(tsconfigFile, ts.sys.fileExists, tsconfigFile.toLowerCase().endsWith(".json")
                ? path_1.basename(tsconfigFile)
                : undefined)) !== null && _c !== void 0 ? _c : "tsconfig.json";
        // We don't want to do it the first time to preserve initial debug status messages. They'll be lost
        // after the user saves a file, but better than nothing...
        let firstStatusReport = true;
        const host = ts.createWatchCompilerHost(tsconfigFile, fixCompilerOptions({}, this.emit), ts.sys, ts.createEmitAndSemanticDiagnosticsBuilderProgram, (diagnostic) => this.logger.diagnostic(diagnostic), (status, newLine, _options, errorCount) => {
            var _a, _b;
            if (!firstStatusReport &&
                errorCount === void 0 &&
                !this.options.getValue("preserveWatchOutput") &&
                this.logger instanceof index_2.ConsoleLogger) {
                (_b = (_a = ts.sys).clearScreen) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            firstStatusReport = false;
            this.logger.info(ts.flattenDiagnosticMessageText(status.messageText, newLine));
        });
        let successFinished = true;
        let currentProgram;
        const runSuccess = () => {
            if (!currentProgram) {
                return;
            }
            if (successFinished) {
                this.logger.resetErrors();
                const inputFiles = this.expandInputFiles(this.entryPoints);
                const baseDir = fs_1.getCommonDirectory(inputFiles);
                const entryPoints = new Array();
                for (const file of inputFiles.map(index_2.normalizePath)) {
                    const sourceFile = currentProgram.getSourceFile(file);
                    if (sourceFile) {
                        entryPoints.push({
                            displayName: getModuleName(path_1.resolve(file), baseDir),
                            path: file,
                            sourceFile,
                            program: currentProgram,
                        });
                    }
                    else {
                        this.logger.warn(`Unable to locate entry point: ${file} within the program defined by ${tsconfigFile}`);
                    }
                }
                const project = this.converter.convert(entryPoints);
                currentProgram = undefined;
                successFinished = false;
                void success(project).then(() => {
                    successFinished = true;
                    runSuccess();
                });
            }
        };
        const origAfterProgramCreate = host.afterProgramCreate;
        host.afterProgramCreate = (program) => {
            if (ts.getPreEmitDiagnostics(program.getProgram()).length === 0) {
                currentProgram = program.getProgram();
                runSuccess();
            }
            origAfterProgramCreate === null || origAfterProgramCreate === void 0 ? void 0 : origAfterProgramCreate(program);
        };
        ts.createWatchProgram(host);
    }
    /**
     * Render HTML for the given project
     */
    async generateDocs(project, out) {
        out = Path.resolve(out);
        await this.renderer.render(project, out);
        if (this.logger.hasErrors()) {
            this.logger.error("Documentation could not be generated due to the errors above.");
        }
        else {
            this.logger.info(`Documentation generated at ${out}`);
        }
    }
    /**
     * Run the converter for the given set of files and write the reflections to a json file.
     *
     * @param out The path and file name of the target file.
     * @returns Whether the JSON file could be written successfully.
     */
    async generateJson(project, out) {
        out = Path.resolve(out);
        const eventData = {
            outputDirectory: Path.dirname(out),
            outputFile: Path.basename(out),
        };
        const ser = this.serializer.projectToObject(project, {
            begin: eventData,
            end: eventData,
        });
        const space = this.options.getValue("pretty") ? "\t" : "";
        await index_2.writeFile(out, JSON.stringify(ser, null, space));
        this.logger.info(`JSON written to ${out}`);
    }
    /**
     * Expand a list of input files.
     *
     * Searches for directories in the input files list and replaces them with a
     * listing of all TypeScript files within them. One may use the ```--exclude``` option
     * to filter out files with a pattern.
     *
     * @param inputFiles  The list of files that should be expanded.
     * @returns  The list of input files with expanded directories.
     */
    expandInputFiles(inputFiles) {
        const files = [];
        const exclude = paths_1.createMinimatch(this.exclude);
        const supportedFileRegex = this.options.getCompilerOptions().allowJs ||
            this.options.getCompilerOptions().checkJs
            ? /\.[tj]sx?$/
            : /\.tsx?$/;
        function add(file, entryPoint) {
            let stats;
            try {
                stats = FS.statSync(file);
            }
            catch (_a) {
                // No permission or a symbolic link, do not resolve.
                return;
            }
            const fileIsDir = stats.isDirectory();
            if (fileIsDir && !file.endsWith("/")) {
                file = `${file}/`;
            }
            if (!entryPoint && paths_1.matchesAny(exclude, file)) {
                return;
            }
            if (fileIsDir) {
                FS.readdirSync(file).forEach((next) => {
                    add(Path.join(file, next), false);
                });
            }
            else if (supportedFileRegex.test(file)) {
                files.push(index_2.normalizePath(file));
            }
        }
        inputFiles.forEach((file) => {
            const resolved = Path.resolve(file);
            if (!FS.existsSync(resolved)) {
                this.logger.warn(`Provided entry point ${file} does not exist and will not be included in the docs.`);
                return;
            }
            add(resolved, true);
        });
        return files;
    }
    getEntryPrograms() {
        const rootProgram = ts.createProgram({
            rootNames: this.options.getFileNames(),
            options: fixCompilerOptions(this.options.getCompilerOptions(), this.emit),
            projectReferences: this.options.getProjectReferences(),
        });
        const programs = [rootProgram];
        // This might be a solution style tsconfig, in which case we need to add a program for each
        // reference so that the converter can look through each of these.
        if (rootProgram.getRootFileNames().length === 0) {
            this.logger.verbose("tsconfig appears to be a solution style tsconfig - creating programs for references");
            const resolvedReferences = rootProgram.getResolvedProjectReferences();
            for (const ref of resolvedReferences !== null && resolvedReferences !== void 0 ? resolvedReferences : []) {
                if (!ref)
                    continue; // This indicates bad configuration... will be reported later.
                programs.push(ts.createProgram({
                    options: fixCompilerOptions(ref.commandLine.options, this.emit),
                    rootNames: ref.commandLine.fileNames,
                    projectReferences: ref.commandLine.projectReferences,
                }));
            }
        }
        return programs;
    }
    /**
     * Converts a list of file-oriented paths in to DocumentationEntryPoints for conversion.
     * This is in contrast with the package-oriented `getEntryPointsForPackages`
     *
     * @param entryPointPaths  The list of filepaths that should be expanded.
     * @returns  The DocumentationEntryPoints corresponding to all the found entry points
     * @internal - if you want to use this, ask, it's likely okay to expose.
     */
    getEntryPointsForPaths(entryPointPaths, programs = this.getEntryPrograms()) {
        const inputFiles = this.expandInputFiles(entryPointPaths);
        const baseDir = fs_1.getCommonDirectory(inputFiles);
        const entryPoints = [];
        entryLoop: for (const file of inputFiles.map(index_2.normalizePath)) {
            for (const program of programs) {
                const sourceFile = program.getSourceFile(file);
                if (sourceFile) {
                    entryPoints.push({
                        displayName: getModuleName(path_1.resolve(file), baseDir),
                        path: file,
                        sourceFile,
                        program,
                    });
                    continue entryLoop;
                }
            }
            this.logger.warn(`Unable to locate entry point: ${file}`);
        }
        return entryPoints;
    }
    /**
     * Print the version number.
     */
    toString() {
        return [
            "",
            `TypeDoc ${Application_1.VERSION}`,
            `Using TypeScript ${this.getTypeScriptVersion()} from ${this.getTypeScriptPath()}`,
            "",
        ].join("\n");
    }
};
/**
 * The version number of TypeDoc.
 */
Application.VERSION = packageInfo.version;
__decorate([
    utils_1.BindOption("logger")
], Application.prototype, "loggerType", void 0);
__decorate([
    utils_1.BindOption("exclude")
], Application.prototype, "exclude", void 0);
__decorate([
    utils_1.BindOption("entryPoints")
], Application.prototype, "entryPoints", void 0);
__decorate([
    utils_1.BindOption("emit")
], Application.prototype, "emit", void 0);
Application = Application_1 = __decorate([
    component_1.Component({ name: "application", internal: true })
], Application);
exports.Application = Application;
