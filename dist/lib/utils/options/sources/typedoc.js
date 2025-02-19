"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTypeDocOptions = void 0;
const loggers_1 = require("../../loggers");
const declaration_1 = require("../declaration");
const shiki_1 = require("shiki");
const sort_1 = require("../../sort");
function addTypeDocOptions(options) {
    options.addDeclaration({
        type: declaration_1.ParameterType.Path,
        name: "options",
        help: "Specify a json option file that should be loaded. If not specified TypeDoc will look for 'typedoc.json' in the current directory",
        hint: declaration_1.ParameterHint.File,
        defaultValue: process.cwd(),
    });
    options.addDeclaration({
        type: declaration_1.ParameterType.Path,
        name: "tsconfig",
        help: "Specify a TypeScript config file that should be loaded. If not specified TypeDoc will look for 'tsconfig.json' in the current directory.",
        hint: declaration_1.ParameterHint.File,
        defaultValue: process.cwd(),
    });
    options.addDeclaration({
        name: "packages",
        help: "Specify one or more package folders from which a package.json file should be loaded to determine the entry points. Your JS files must have sourcemaps for this to work." +
            "If the root of an npm or Yarn workspace is given, the packages specified in `workspaces` will be loaded.",
        type: declaration_1.ParameterType.PathArray,
        defaultValue: [],
    });
    options.addDeclaration({
        name: "entryPoints",
        help: "The entry points of your library, which files should be documented as available to consumers.",
        type: declaration_1.ParameterType.PathArray,
    });
    options.addDeclaration({
        name: "exclude",
        help: "Define patterns to be excluded when expanding a directory that was specified as an entry point.",
        type: declaration_1.ParameterType.GlobArray,
    });
    options.addDeclaration({
        name: "externalPattern",
        help: "Define patterns for files that should be considered being external.",
        type: declaration_1.ParameterType.GlobArray,
        defaultValue: ["**/node_modules/**"],
    });
    options.addDeclaration({
        name: "excludeExternals",
        help: "Prevent externally resolved symbols from being documented.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeNotDocumented",
        help: "Prevent symbols that are not explicitly documented from appearing in the results.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeInternal",
        help: "Prevent symbols that are marked with @internal from being documented.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludePrivate",
        help: "Ignores private variables and methods",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeProtected",
        help: "Ignores protected variables and methods",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "disableSources",
        help: "Disables setting the source of a reflection when documenting it.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "includes",
        help: "Specifies the location to look for included documents (use [[include:FILENAME]] in comments).",
        type: declaration_1.ParameterType.Path,
        hint: declaration_1.ParameterHint.Directory,
    });
    options.addDeclaration({
        name: "media",
        help: "Specifies the location with media files that should be copied to the output directory.",
        type: declaration_1.ParameterType.Path,
        hint: declaration_1.ParameterHint.Directory,
    });
    options.addDeclaration({
        name: "watch",
        help: "Watch files for changes and rebuild docs on change.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "preserveWatchOutput",
        help: "If set, TypeDoc will not clear the screen between compilation runs.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "emit",
        help: "If set, TypeDoc will emit the TypeScript compilation result",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "out",
        help: "Specifies the location the documentation should be written to.",
        type: declaration_1.ParameterType.Path,
        hint: declaration_1.ParameterHint.Directory,
    });
    options.addDeclaration({
        name: "json",
        help: "Specifies the location and filename a JSON file describing the project is written to.",
        type: declaration_1.ParameterType.Path,
        hint: declaration_1.ParameterHint.File,
    });
    options.addDeclaration({
        name: "pretty",
        help: "Specifies whether the output JSON should be formatted with tabs.",
        type: declaration_1.ParameterType.Boolean,
        defaultValue: true,
    });
    options.addDeclaration({
        name: "theme",
        help: "Specify the path to the theme that should be used, or 'default' or 'minimal' to use built-in themes." +
            "Note: Not resolved according to the config file location, always resolved according to cwd.",
        type: declaration_1.ParameterType.String,
        defaultValue: "default",
    });
    options.addDeclaration({
        name: "highlightTheme",
        help: "Specifies the code highlighting theme.",
        type: declaration_1.ParameterType.String,
        defaultValue: "light-plus",
        validate: (value) => {
            if (!shiki_1.BUNDLED_THEMES.includes(value)) {
                throw new Error(`highlightTheme must be one of the following: ${shiki_1.BUNDLED_THEMES.join(", ")}`);
            }
        },
    });
    options.addDeclaration({
        name: "name",
        help: "Set the name of the project that will be used in the header of the template.",
    });
    options.addDeclaration({
        name: "includeVersion",
        help: "Add the package version to the project name.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeTags",
        help: "Remove the listed tags from doc comments.",
        type: declaration_1.ParameterType.Array,
    });
    options.addDeclaration({
        name: "readme",
        help: "Path to the readme file that should be displayed on the index page. Pass `none` to disable the index page and start the documentation on the globals page.",
        type: declaration_1.ParameterType.Path,
    });
    options.addDeclaration({
        name: "defaultCategory",
        help: "Specifies the default category for reflections without a category.",
        defaultValue: "Other",
    });
    options.addDeclaration({
        name: "categoryOrder",
        help: "Specifies the order in which categories appear. * indicates the relative order for categories not in the list.",
        type: declaration_1.ParameterType.Array,
    });
    options.addDeclaration({
        name: "categorizeByGroup",
        help: "Specifies whether categorization will be done at the group level.",
        type: declaration_1.ParameterType.Boolean,
        defaultValue: true,
    });
    options.addDeclaration({
        name: "sort",
        help: "Specify the sort strategy for documented values",
        type: declaration_1.ParameterType.Array,
        defaultValue: ["kind", "instance-first", "alphabetical"],
        validate(value) {
            const invalid = new Set(value);
            for (const v of sort_1.SORT_STRATEGIES) {
                invalid.delete(v);
            }
            if (invalid.size !== 0) {
                throw new Error(`sort may only specify known values, and invalid values were provided (${Array.from(invalid).join(", ")}). The valid sort strategies are:\n${sort_1.SORT_STRATEGIES.join(", ")}`);
            }
        },
    });
    options.addDeclaration({
        name: "gitRevision",
        help: "Use specified revision instead of the last revision for linking to GitHub source files.",
    });
    options.addDeclaration({
        name: "gitRemote",
        help: "Use the specified remote for linking to GitHub source files.",
        defaultValue: "origin",
    });
    options.addDeclaration({
        name: "gaID",
        help: "Set the Google Analytics tracking ID and activate tracking code.",
    });
    options.addDeclaration({
        name: "gaSite",
        help: "Set the site name for Google Analytics. Defaults to `auto`.",
        defaultValue: "auto",
    });
    options.addDeclaration({
        name: "hideGenerator",
        help: "Do not print the TypeDoc link at the end of the page.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "toc",
        help: "Define the contents of the top level table of contents as a comma-separated list of global symbols.",
        type: declaration_1.ParameterType.Array,
    });
    options.addDeclaration({
        name: "disableOutputCheck",
        help: "Should TypeDoc disable the testing and cleaning of the output directory?",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "help",
        help: "Print this message.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "version",
        help: "Print TypeDoc's version.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "showConfig",
        help: "Print the resolved configuration and exit",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "plugin",
        help: "Specify the npm plugins that should be loaded. Omit to load all installed plugins, set to 'none' to load no plugins.",
        type: declaration_1.ParameterType.ModuleArray,
    });
    options.addDeclaration({
        name: "logger",
        help: "Specify the logger that should be used, 'none' or 'console'",
        defaultValue: "console",
        type: declaration_1.ParameterType.Mixed,
    });
    options.addDeclaration({
        name: "logLevel",
        help: "Specify what level of logging should be used.",
        type: declaration_1.ParameterType.Map,
        map: loggers_1.LogLevel,
        defaultValue: loggers_1.LogLevel.Info,
    });
    options.addDeclaration({
        name: "treatWarningsAsErrors",
        help: "If set, warnings will be treated as errors.",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "listInvalidSymbolLinks",
        help: "Emits a list of broken symbol [[navigation]] links after documentation generation",
        type: declaration_1.ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "markedOptions",
        help: "Specify the options passed to Marked, the Markdown parser used by TypeDoc",
        type: declaration_1.ParameterType.Mixed,
    });
}
exports.addTypeDocOptions = addTypeDocOptions;
