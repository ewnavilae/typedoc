import { SourceReference } from "../sources/file";
import { Type } from "../types/index";
import { Comment } from "../comments/comment";
import { TypeParameterReflection } from "./type-parameter";
import { ProjectReflection } from "./project";
import { NeverIfInternal } from "../../utils";
/**
 * Reset the reflection id.
 *
 * Used by the test cases to ensure the reflection ids won't change between runs.
 */
export declare function resetReflectionID(): void;
/**
 * Defines the available reflection kinds.
 */
export declare enum ReflectionKind {
    Project = 0,
    Module = 1,
    Namespace = 2,
    Enum = 4,
    EnumMember = 16,
    Variable = 32,
    Function = 64,
    Class = 128,
    Interface = 256,
    Constructor = 512,
    Property = 1024,
    Method = 2048,
    CallSignature = 4096,
    IndexSignature = 8192,
    ConstructorSignature = 16384,
    Parameter = 32768,
    TypeLiteral = 65536,
    TypeParameter = 131072,
    Accessor = 262144,
    GetSignature = 524288,
    SetSignature = 1048576,
    ObjectLiteral = 2097152,
    TypeAlias = 4194304,
    Event = 8388608,
    Reference = 16777216
}
export declare namespace ReflectionKind {
    const All: number;
    const ClassOrInterface: number;
    const VariableOrProperty: number;
    const FunctionOrMethod: number;
    const ClassMember: number;
    const SomeSignature: number;
    const SomeModule: number;
    const SomeType: number;
    const SomeValue: number;
    /** @internal */
    const Inheritable: number;
}
export declare enum ReflectionFlag {
    None = 0,
    Private = 1,
    Protected = 2,
    Public = 4,
    Static = 8,
    ExportAssignment = 16,
    External = 32,
    Optional = 64,
    DefaultValue = 128,
    Rest = 256,
    Abstract = 512,
    Const = 1024,
    Let = 2048,
    Readonly = 4096
}
/**
 * This must extend Array in order to work with Handlebar's each helper.
 */
export declare class ReflectionFlags extends Array<string> {
    private flags;
    hasFlag(flag: ReflectionFlag): boolean;
    /**
     * Is this a private member?
     */
    get isPrivate(): boolean;
    /**
     * Is this a protected member?
     */
    get isProtected(): boolean;
    /**
     * Is this a public member?
     */
    get isPublic(): boolean;
    /**
     * Is this a static member?
     */
    get isStatic(): boolean;
    /**
     * Is this a declaration from an external document?
     */
    get isExternal(): boolean;
    /**
     * Whether this reflection is an optional component or not.
     *
     * Applies to function parameters and object members.
     */
    get isOptional(): boolean;
    /**
     * Whether it's a rest parameter, like `foo(...params);`.
     */
    get isRest(): boolean;
    get hasExportAssignment(): boolean;
    get isAbstract(): boolean;
    get isConst(): boolean;
    get isLet(): boolean;
    get isReadonly(): boolean;
    setFlag(flag: ReflectionFlag, set: boolean): void;
    private setSingleFlag;
}
export interface DefaultValueContainer extends Reflection {
    defaultValue?: string;
}
export interface TypeContainer extends Reflection {
    type?: Type;
}
export interface TypeParameterContainer extends Reflection {
    typeParameters?: TypeParameterReflection[];
}
export declare enum TraverseProperty {
    Children = 0,
    Parameters = 1,
    TypeLiteral = 2,
    TypeParameter = 3,
    Signatures = 4,
    IndexSignature = 5,
    GetSignature = 6,
    SetSignature = 7
}
export interface TraverseCallback {
    /**
     * May return false to bail out of any further iteration. To preserve backwards compatibility, if
     * a function returns undefined, iteration must continue.
     */
    (reflection: Reflection, property: TraverseProperty): boolean | NeverIfInternal<void>;
}
/**
 * Defines the usage of a decorator.
 */
export interface Decorator {
    /**
     * The name of the decorator being applied.
     */
    name: string;
    /**
     * The type declaring the decorator.
     * Usually a ReferenceType instance pointing to the decorator function.
     */
    type?: Type;
    /**
     * A named map of arguments the decorator is applied with.
     */
    arguments?: any;
}
/**
 * Base class for all reflection classes.
 *
 * While generating a documentation, TypeDoc generates an instance of [[ProjectReflection]]
 * as the root for all reflections within the project. All other reflections are represented
 * by the [[DeclarationReflection]] class.
 *
 * This base class exposes the basic properties one may use to traverse the reflection tree.
 * You can use the [[children]] and [[parent]] properties to walk the tree. The [[groups]] property
 * contains a list of all children grouped and sorted for being rendered.
 */
export declare abstract class Reflection {
    /**
     * Unique id of this reflection.
     */
    id: number;
    /**
     * The symbol name of this reflection.
     */
    name: string;
    /**
     * The original name of the TypeScript declaration.
     */
    originalName: string;
    /**
     * The kind of this reflection.
     */
    kind: ReflectionKind;
    /**
     * The human readable string representation of the kind of this reflection.
     * Set during the resolution phase by GroupPlugin
     */
    kindString?: string;
    flags: ReflectionFlags;
    /**
     * The reflection this reflection is a child of.
     */
    parent?: Reflection;
    get project(): ProjectReflection;
    /**
     * The parsed documentation comment attached to this reflection.
     */
    comment?: Comment;
    /**
     * A list of all source files that contributed to this reflection.
     */
    sources?: SourceReference[];
    /**
     * A list of all decorators attached to this reflection.
     */
    decorators?: Decorator[];
    /**
     * A list of all types that are decorated by this reflection.
     */
    decorates?: Type[];
    /**
     * The url of this reflection in the generated documentation.
     * TODO: Reflections shouldn't know urls exist. Move this to a serializer.
     */
    url?: string;
    /**
     * The name of the anchor of this child.
     * TODO: Reflections shouldn't know anchors exist. Move this to a serializer.
     */
    anchor?: string;
    /**
     * Is the url pointing to an individual document?
     *
     * When FALSE, the url points to an anchor tag on a page of a different reflection.
     * TODO: Reflections shouldn't know how they are rendered. Move this to the correct serializer.
     */
    hasOwnDocument?: boolean;
    /**
     * A list of generated css classes that should be applied to representations of this
     * reflection in the generated markup.
     * TODO: Reflections shouldn't know about CSS. Move this property to the correct serializer.
     */
    cssClasses?: string;
    /**
     * Url safe alias for this reflection.
     *
     * @see [[BaseReflection.getAlias]]
     */
    private _alias?;
    private _aliases?;
    /**
     * Create a new BaseReflection instance.
     */
    constructor(name: string, kind: ReflectionKind, parent?: Reflection);
    /**
     * Test whether this reflection is of the given kind.
     */
    kindOf(kind: ReflectionKind | ReflectionKind[]): boolean;
    /**
     * Return the full name of this reflection.
     *
     * The full name contains the name of this reflection and the names of all parent reflections.
     *
     * @param separator  Separator used to join the names of the reflections.
     * @returns The full name of this reflection.
     */
    getFullName(separator?: string): string;
    /**
     * Set a flag on this reflection.
     */
    setFlag(flag: ReflectionFlag, value?: boolean): void;
    /**
     * Return an url safe alias for this reflection.
     */
    getAlias(): string;
    /**
     * Has this reflection a visible comment?
     *
     * @returns TRUE when this reflection has a visible comment.
     */
    hasComment(): boolean;
    hasGetterOrSetter(): boolean;
    /**
     * Return a child by its name.
     *
     * @param names The name hierarchy of the child to look for.
     * @returns The found child or undefined.
     */
    getChildByName(arg: string | string[]): Reflection | undefined;
    /**
     * Return whether this reflection is the root / project reflection.
     */
    isProject(): this is ProjectReflection;
    /**
     * Try to find a reflection by its name.
     *
     * @return The found reflection or null.
     */
    findReflectionByName(arg: string | string[]): Reflection | undefined;
    /**
     * Traverse all potential child reflections of this reflection.
     *
     * The given callback will be invoked for all children, signatures and type parameters
     * attached to this reflection.
     *
     * @param callback  The callback function that should be applied for each child reflection.
     */
    traverse(_callback: TraverseCallback): void;
    /**
     * Return a string representation of this reflection.
     */
    toString(): string;
    /**
     * Return a string representation of this reflection and all of its children.
     *
     * @param indent  Used internally to indent child reflections.
     */
    toStringHierarchy(indent?: string): string;
}
