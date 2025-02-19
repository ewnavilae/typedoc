"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindOption = exports.Options = void 0;
const array_1 = require("../array");
const declaration_1 = require("./declaration");
const sources_1 = require("./sources");
/**
 * Maintains a collection of option declarations split into TypeDoc options
 * and TypeScript options. Ensures options are of the correct type for calling
 * code.
 *
 * ### Option Discovery
 *
 * Since plugins commonly add custom options, and TypeDoc does not permit options which have
 * not been declared to be set, options must be read twice. The first time options are read,
 * a noop logger is passed so that any errors are ignored. Then, after loading plugins, options
 * are read again, this time with the logger specified by the application.
 *
 * Options are read in a specific order.
 * 1. argv (0) - Must be read first since it should change the files read when
 *    passing --options or --tsconfig.
 * 2. typedoc-json (100) - Read next so that it can specify the tsconfig.json file to read.
 * 3. tsconfig-json (200) - Last config file reader, cannot specify the typedoc.json file to read.
 * 4. argv (300) - Read argv again since any options set there should override those set in config
 *    files.
 */
class Options {
    constructor(logger) {
        this._readers = [];
        this._declarations = new Map();
        this._values = {};
        this._setOptions = new Set();
        this._compilerOptions = {};
        this._fileNames = [];
        this._projectReferences = [];
        this._logger = logger;
    }
    /**
     * Marks the options as readonly, enables caching when fetching options, which improves performance.
     */
    freeze() {
        Object.freeze(this._values);
    }
    /**
     * Checks if the options object has been frozen, preventing future changes to option values.
     */
    isFrozen() {
        return Object.isFrozen(this._values);
    }
    /**
     * Sets the logger used when an option declaration fails to be added.
     * @param logger
     */
    setLogger(logger) {
        this._logger = logger;
    }
    /**
     * Adds the option declarations declared by the TypeDoc and all supported TypeScript declarations.
     */
    addDefaultDeclarations() {
        sources_1.addTypeDocOptions(this);
    }
    /**
     * Resets the option bag to all default values.
     */
    reset() {
        for (const declaration of this.getDeclarations()) {
            this._values[declaration.name] = declaration_1.getDefaultValue(declaration);
        }
        this._setOptions.clear();
        this._compilerOptions = {};
        this._fileNames = [];
    }
    /**
     * Adds an option reader that will be used to read configuration values
     * from the command line, configuration files, or other locations.
     * @param reader
     */
    addReader(reader) {
        array_1.insertPrioritySorted(this._readers, reader);
    }
    /**
     * Removes all readers of a given name.
     * @param name
     */
    removeReaderByName(name) {
        this._readers = this._readers.filter((reader) => reader.name !== name);
    }
    read(logger) {
        for (const reader of this._readers) {
            reader.read(this, logger);
        }
    }
    addDeclaration(declaration) {
        const decl = this.getDeclaration(declaration.name);
        if (decl) {
            this._logger.error(`The option ${declaration.name} has already been registered`);
        }
        else {
            this._declarations.set(declaration.name, declaration);
        }
        this._values[declaration.name] = declaration_1.getDefaultValue(declaration);
    }
    /**
     * Adds the given declarations to the container
     * @param declarations
     *
     * @privateRemarks
     * This function explicitly provides a way out of the strict typing enforced
     * by {@link addDeclaration}. It should only be used with careful validation
     * of the declaration map. Internally, it is only used for adding TS options
     */
    addDeclarations(declarations) {
        for (const decl of declarations) {
            this.addDeclaration(decl);
        }
    }
    /**
     * Removes a declared option.
     * WARNING: This is probably a bad idea. If you do this you will probably cause a crash
     * when code assumes that an option that it declared still exists.
     * @param name
     */
    removeDeclarationByName(name) {
        const declaration = this.getDeclaration(name);
        if (declaration) {
            this._declarations.delete(declaration.name);
            delete this._values[declaration.name];
        }
    }
    /**
     * Gets a declaration by one of its names.
     * @param name
     */
    getDeclaration(name) {
        return this._declarations.get(name);
    }
    /**
     * Gets all declared options.
     */
    getDeclarations() {
        return array_1.unique(this._declarations.values());
    }
    isSet(name) {
        if (!this._declarations.has(name)) {
            throw new Error("Tried to check if an undefined option was set");
        }
        return this._setOptions.has(name);
    }
    /**
     * Gets all of the TypeDoc option values defined in this option container.
     */
    getRawValues() {
        return this._values;
    }
    getValue(name) {
        const declaration = this.getDeclaration(name);
        if (!declaration) {
            throw new Error(`Unknown option '${name}'`);
        }
        return this._values[declaration.name];
    }
    setValue(name, value, configPath) {
        if (this.isFrozen()) {
            throw new Error("Tried to modify an option value after options have been sealed.");
        }
        const declaration = this.getDeclaration(name);
        if (!declaration) {
            throw new Error(`Tried to set an option (${name}) that was not declared.`);
        }
        const converted = declaration_1.convert(value, declaration, configPath !== null && configPath !== void 0 ? configPath : process.cwd());
        this._values[declaration.name] = converted;
        this._setOptions.add(name);
    }
    /**
     * Gets the set compiler options.
     */
    getCompilerOptions() {
        return this._compilerOptions;
    }
    /**
     * Gets the file names discovered through reading a tsconfig file.
     */
    getFileNames() {
        return this._fileNames;
    }
    /**
     * Gets the project references - used in solution style tsconfig setups.
     */
    getProjectReferences() {
        return this._projectReferences;
    }
    /**
     * Sets the compiler options that will be used to get a TS program.
     */
    setCompilerOptions(fileNames, options, projectReferences) {
        if (this.isFrozen()) {
            throw new Error("Tried to modify an option value after options have been sealed.");
        }
        // We do this here instead of in the tsconfig reader so that API consumers which
        // supply a program to `Converter.convert` instead of letting TypeDoc create one
        // can just set the compiler options, and not need to know about this mapping.
        // It feels a bit like a hack... but it's better to have it here than to put it
        // in Application or Converter.
        if (options.stripInternal && !this.isSet("excludeInternal")) {
            this.setValue("excludeInternal", true);
        }
        this._fileNames = fileNames;
        this._compilerOptions = { ...options };
        this._projectReferences = projectReferences !== null && projectReferences !== void 0 ? projectReferences : [];
    }
}
exports.Options = Options;
function BindOption(name) {
    return function (target, key) {
        Object.defineProperty(target, key, {
            get() {
                const options = "options" in this ? this.options : this.application.options;
                const value = options.getValue(name);
                if (options.isFrozen()) {
                    Object.defineProperty(this, key, { value });
                }
                return value;
            },
            enumerable: true,
            configurable: true,
        });
    };
}
exports.BindOption = BindOption;
