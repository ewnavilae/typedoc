import { Theme as ShikiTheme } from "shiki";
import { LogLevel } from "../loggers";
import { SortStrategy } from "../sort";
/**
 * An interface describing all TypeDoc specific options. Generated from a
 * map which contains more information about each option for better types when
 * defining said options.
 */
export declare type TypeDocOptions = {
    [K in keyof TypeDocOptionMap]: TypeDocOptionMap[K] extends Record<string, infer U> ? Exclude<U, string> | keyof TypeDocOptionMap[K] : TypeDocOptionMap[K];
};
/**
 * Describes all TypeDoc specific options as returned by {@link Options.getValue}, this is
 * slightly more restrictive than the {@link TypeDocOptions} since it does not allow both
 * keys and values for mapped option types.
 */
export declare type TypeDocOptionValues = {
    [K in keyof TypeDocOptionMap]: TypeDocOptionMap[K] extends Record<string, infer U> ? Exclude<U, string> : TypeDocOptionMap[K];
};
/**
 * Describes all TypeDoc options. Used internally to provide better types when fetching options.
 * External consumers should likely use [[TypeDocOptions]] instead.
 */
export interface TypeDocOptionMap {
    options: string;
    tsconfig: string;
    packages: string[];
    entryPoints: string[];
    exclude: string[];
    externalPattern: string[];
    excludeExternals: boolean;
    excludePrivate: boolean;
    excludeProtected: boolean;
    excludeNotDocumented: boolean;
    excludeInternal: boolean;
    disableSources: boolean;
    includes: string;
    media: string;
    emit: boolean;
    watch: boolean;
    preserveWatchOutput: boolean;
    out: string;
    json: string;
    pretty: boolean;
    theme: string;
    name: string;
    includeVersion: boolean;
    excludeTags: string[];
    readme: string;
    defaultCategory: string;
    categoryOrder: string[];
    categorizeByGroup: boolean;
    sort: SortStrategy[];
    gitRevision: string;
    gitRemote: string;
    gaID: string;
    gaSite: string;
    hideGenerator: boolean;
    toc: string[];
    disableOutputCheck: boolean;
    help: boolean;
    version: boolean;
    showConfig: boolean;
    plugin: string[];
    logger: unknown;
    logLevel: typeof LogLevel;
    treatWarningsAsErrors: boolean;
    listInvalidSymbolLinks: boolean;
    markedOptions: unknown;
    highlightTheme: ShikiTheme;
}
/**
 * Converts a given TypeDoc option key to the type of the declaration expected.
 */
export declare type KeyToDeclaration<K extends keyof TypeDocOptionMap> = TypeDocOptionMap[K] extends boolean ? BooleanDeclarationOption : TypeDocOptionMap[K] extends string ? StringDeclarationOption : TypeDocOptionMap[K] extends number ? NumberDeclarationOption : TypeDocOptionMap[K] extends string[] ? ArrayDeclarationOption : unknown extends TypeDocOptionMap[K] ? MixedDeclarationOption : TypeDocOptionMap[K] extends Record<string | number, infer U> ? MapDeclarationOption<U> : never;
export declare enum ParameterHint {
    File = 0,
    Directory = 1
}
export declare enum ParameterType {
    String = 0,
    /**
     * Resolved according to the config directory.
     */
    Path = 1,
    Number = 2,
    Boolean = 3,
    Map = 4,
    Mixed = 5,
    Array = 6,
    /**
     * Resolved according to the config directory.
     */
    PathArray = 7,
    /**
     * Resolved according to the config directory if it starts with `.`
     */
    ModuleArray = 8,
    /**
     * Resolved according to the config directory unless it starts with `**`, after skipping any leading `!` and `#` characters.
     */
    GlobArray = 9
}
export interface DeclarationOptionBase {
    /**
     * The option name.
     */
    name: string;
    /**
     * The help text to be displayed to the user when --help is passed.
     */
    help: string;
    /**
     * The parameter type, used to convert user configuration values into the expected type.
     * If not set, the type will be a string.
     */
    type?: ParameterType;
}
export interface StringDeclarationOption extends DeclarationOptionBase {
    /**
     * Specifies the resolution strategy. If `Path` is provided, values will be resolved according to their
     * location in a file. If `String` or no value is provided, values will not be resolved.
     */
    type?: ParameterType.String | ParameterType.Path;
    /**
     * If not specified defaults to the empty string for both `String` and `Path`.
     */
    defaultValue?: string;
    /**
     * An optional hint for the type of input expected, will be displayed in the help output.
     */
    hint?: ParameterHint;
    /**
     * An optional validation function that validates a potential value of this option.
     * The function must throw an Error if the validation fails and should do nothing otherwise.
     */
    validate?: (value: string) => void;
}
export interface NumberDeclarationOption extends DeclarationOptionBase {
    type: ParameterType.Number;
    /**
     * Lowest possible value.
     */
    minValue?: number;
    /**
     * Highest possible value.
     */
    maxValue?: number;
    /**
     * If not specified defaults to 0.
     */
    defaultValue?: number;
    /**
     * An optional validation function that validates a potential value of this option.
     * The function must throw an Error if the validation fails and should do nothing otherwise.
     */
    validate?: (value: number) => void;
}
export interface BooleanDeclarationOption extends DeclarationOptionBase {
    type: ParameterType.Boolean;
    /**
     * If not specified defaults to false.
     */
    defaultValue?: boolean;
}
export interface ArrayDeclarationOption extends DeclarationOptionBase {
    type: ParameterType.Array | ParameterType.PathArray | ParameterType.ModuleArray | ParameterType.GlobArray;
    /**
     * If not specified defaults to an empty array.
     */
    defaultValue?: string[];
    /**
     * An optional validation function that validates a potential value of this option.
     * The function must throw an Error if the validation fails and should do nothing otherwise.
     */
    validate?: (value: string[]) => void;
}
export interface MixedDeclarationOption extends DeclarationOptionBase {
    type: ParameterType.Mixed;
    /**
     * If not specified defaults to undefined.
     */
    defaultValue?: unknown;
    /**
     * An optional validation function that validates a potential value of this option.
     * The function must throw an Error if the validation fails and should do nothing otherwise.
     */
    validate?: (value: unknown) => void;
}
export interface MapDeclarationOption<T> extends DeclarationOptionBase {
    type: ParameterType.Map;
    /**
     * Maps a given value to the option type. The map type may be a TypeScript enum.
     * In that case, when generating an error message for a mismatched key, the numeric
     * keys will not be listed.
     */
    map: Map<string, T> | Record<string | number, T>;
    /**
     * Unlike the rest of the option types, there is no sensible generic default for mapped option types.
     * The default value for a mapped type must be specified.
     */
    defaultValue: T;
    /**
     * Optional override for the error reported when an invalid key is provided.
     */
    mapError?: string;
}
export declare type DeclarationOption = StringDeclarationOption | NumberDeclarationOption | BooleanDeclarationOption | MixedDeclarationOption | MapDeclarationOption<unknown> | ArrayDeclarationOption;
interface ParameterTypeToOptionTypeMap {
    [ParameterType.String]: string;
    [ParameterType.Path]: string;
    [ParameterType.Number]: number;
    [ParameterType.Boolean]: boolean;
    [ParameterType.Mixed]: unknown;
    [ParameterType.Array]: string[];
    [ParameterType.PathArray]: string[];
    [ParameterType.ModuleArray]: string[];
    [ParameterType.GlobArray]: string[];
    [ParameterType.Map]: unknown;
}
export declare type DeclarationOptionToOptionType<T extends DeclarationOption> = T extends MapDeclarationOption<infer U> ? U : ParameterTypeToOptionTypeMap[Exclude<T["type"], undefined>];
/**
 * The default conversion function used by the Options container. Readers may
 * re-use this conversion function or implement their own. The arguments reader
 * implements its own since 'false' should not be converted to true for a boolean option.
 * @param value The value to convert.
 * @param option The option for which the value should be converted.
 * @returns The result of the conversion. Might be the value or an error.
 */
export declare function convert(value: unknown, option: DeclarationOption, configPath: string): unknown;
export declare function getDefaultValue(option: DeclarationOption): unknown;
export {};
