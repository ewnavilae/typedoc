"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentsReader = void 0;
const declaration_1 = require("../declaration");
const ARRAY_OPTION_TYPES = new Set([
    declaration_1.ParameterType.Array,
    declaration_1.ParameterType.PathArray,
    declaration_1.ParameterType.ModuleArray,
    declaration_1.ParameterType.GlobArray,
]);
/**
 * Obtains option values from command-line arguments
 */
class ArgumentsReader {
    constructor(priority, args = process.argv.slice(2)) {
        this.name = "arguments";
        this.priority = priority;
        this.args = args;
    }
    read(container, logger) {
        // Make container's type more lax, we do the appropriate checks manually.
        const options = container;
        const seen = new Set();
        let index = 0;
        const trySet = (name, value) => {
            try {
                options.setValue(name, value);
            }
            catch (err) {
                logger.error(err.message);
            }
        };
        while (index < this.args.length) {
            const name = this.args[index];
            const decl = name.startsWith("-")
                ? (index++, options.getDeclaration(name.replace(/^--?/, "")))
                : options.getDeclaration("entryPoints");
            if (decl) {
                if (seen.has(decl.name) && ARRAY_OPTION_TYPES.has(decl.type)) {
                    trySet(decl.name, options.getValue(decl.name).concat(this.args[index]));
                }
                else if (decl.type === declaration_1.ParameterType.Boolean) {
                    const value = String(this.args[index]).toLowerCase();
                    if (value === "true" || value === "false") {
                        trySet(decl.name, value === "true");
                    }
                    else {
                        trySet(decl.name, true);
                        // Bool option didn't consume the next argument as expected.
                        index--;
                    }
                }
                else {
                    if (index === this.args.length) {
                        // Only boolean values have optional values.
                        logger.warn(`--${decl.name} expected a value, but none was given as an argument`);
                    }
                    trySet(decl.name, this.args[index]);
                }
                seen.add(decl.name);
            }
            else {
                logger.error(`Unknown option: ${name}`);
            }
            index++;
        }
    }
}
exports.ArgumentsReader = ArgumentsReader;
