"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSymbol = void 0;
const assert = require("assert");
const ts = require("typescript");
const models_1 = require("../models");
const array_1 = require("../utils/array");
const enum_1 = require("../utils/enum");
const convert_expression_1 = require("./convert-expression");
const converter_events_1 = require("./converter-events");
const index_signature_1 = require("./factories/index-signature");
const signature_1 = require("./factories/signature");
const jsdoc_1 = require("./jsdoc");
const reflections_1 = require("./utils/reflections");
const symbolConverters = {
    [ts.SymbolFlags.RegularEnum]: convertEnum,
    [ts.SymbolFlags.ConstEnum]: convertEnum,
    [ts.SymbolFlags.EnumMember]: convertEnumMember,
    [ts.SymbolFlags.ValueModule]: convertNamespace,
    [ts.SymbolFlags.NamespaceModule]: convertNamespace,
    [ts.SymbolFlags.TypeAlias]: convertTypeAlias,
    [ts.SymbolFlags.Function]: convertFunctionOrMethod,
    [ts.SymbolFlags.Method]: convertFunctionOrMethod,
    [ts.SymbolFlags.Interface]: convertClassOrInterface,
    [ts.SymbolFlags.Property]: convertProperty,
    [ts.SymbolFlags.Class]: convertClassOrInterface,
    [ts.SymbolFlags.Constructor]: convertConstructor,
    [ts.SymbolFlags.Alias]: convertAlias,
    [ts.SymbolFlags.BlockScopedVariable]: convertVariable,
    [ts.SymbolFlags.FunctionScopedVariable]: convertVariable,
    [ts.SymbolFlags.GetAccessor]: convertAccessor,
    [ts.SymbolFlags.SetAccessor]: convertAccessor,
};
// Sanity check, if this fails a dev messed up.
for (const key of Object.keys(symbolConverters)) {
    if (!Number.isInteger(Math.log2(+key))) {
        throw new Error(`Symbol converter for key ${ts.SymbolFlags[+key]} does not specify a valid flag value.`);
    }
}
function convertSymbol(context, symbol, exportSymbol) {
    var _a, _b;
    if (context.shouldIgnore(symbol)) {
        return;
    }
    // This check can catch symbols which ought to be documented as references
    // but aren't aliased symbols because `export *` was used.
    const previous = context.project.getReflectionFromSymbol(symbol);
    if (previous &&
        ((_a = previous.parent) === null || _a === void 0 ? void 0 : _a.kindOf(models_1.ReflectionKind.Module | models_1.ReflectionKind.Project))) {
        createAlias(previous, context, symbol, exportSymbol);
        return;
    }
    let flags = enum_1.removeFlag(symbol.flags, ts.SymbolFlags.Transient |
        ts.SymbolFlags.Assignment |
        ts.SymbolFlags.Optional |
        ts.SymbolFlags.Prototype);
    // Declaration merging - the only type (excluding enum/enum, ns/ns, etc)
    // that TD supports is merging a class and interface. All others are
    // represented as multiple reflections
    if (enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.Class)) {
        flags = enum_1.removeFlag(flags, ts.SymbolFlags.Interface | ts.SymbolFlags.Function);
    }
    // Kind of declaration merging... we treat this as a property with get/set signatures.
    if (enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.GetAccessor)) {
        flags = enum_1.removeFlag(flags, ts.SymbolFlags.SetAccessor);
    }
    if (enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.NamespaceModule)) {
        // This might be here if a namespace is declared several times.
        flags = enum_1.removeFlag(flags, ts.SymbolFlags.ValueModule);
    }
    if (enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.Method)) {
        // This happens when someone declares an object with methods:
        // { methodProperty() {} }
        flags = enum_1.removeFlag(flags, ts.SymbolFlags.Property);
    }
    for (const flag of enum_1.getEnumFlags(flags)) {
        if (!(flag in symbolConverters)) {
            context.logger.verbose(`Missing converter for symbol: ${symbol.name} with flag ${ts.SymbolFlags[flag]}`);
        }
        (_b = symbolConverters[flag]) === null || _b === void 0 ? void 0 : _b.call(symbolConverters, context, symbol, exportSymbol);
    }
}
exports.convertSymbol = convertSymbol;
function convertSymbols(context, symbols) {
    for (const symbol of symbols) {
        convertSymbol(context, symbol);
    }
}
function convertEnum(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Enum, symbol, exportSymbol);
    if (symbol.flags & ts.SymbolFlags.ConstEnum) {
        reflection.setFlag(models_1.ReflectionFlag.Const);
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    convertSymbols(context.withScope(reflection), context.checker
        .getExportsOfModule(symbol)
        .filter((s) => s.flags & ts.SymbolFlags.EnumMember));
}
function convertEnumMember(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.EnumMember, symbol, exportSymbol);
    reflection.defaultValue = JSON.stringify(context.checker.getConstantValue(symbol.getDeclarations()[0]));
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
}
function convertNamespace(context, symbol, exportSymbol) {
    var _a;
    let exportFlags = ts.SymbolFlags.ModuleMember;
    // This can happen in JS land where "class" functions get tagged as a namespace too
    if (((_a = symbol
        .getDeclarations()) === null || _a === void 0 ? void 0 : _a.some((d) => ts.isModuleDeclaration(d) || ts.isSourceFile(d))) !==
        true) {
        exportFlags = ts.SymbolFlags.ClassMember;
        if (enum_1.hasAnyFlag(symbol.flags, ts.SymbolFlags.Class)) {
            return;
        }
    }
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Namespace, symbol, exportSymbol);
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    convertSymbols(context.withScope(reflection), context.checker
        .getExportsOfModule(symbol)
        .filter((s) => s.flags & exportFlags));
}
function convertTypeAlias(context, symbol, exportSymbol) {
    var _a, _b;
    const declaration = (_a = symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.find((d) => ts.isTypeAliasDeclaration(d) ||
        ts.isJSDocTypedefTag(d) ||
        ts.isJSDocCallbackTag(d) ||
        ts.isJSDocEnumTag(d));
    assert(declaration);
    if (ts.isTypeAliasDeclaration(declaration)) {
        const reflection = context.createDeclarationReflection(models_1.ReflectionKind.TypeAlias, symbol, exportSymbol);
        reflection.type = context.converter.convertType(context.withScope(reflection), declaration.type);
        reflection.typeParameters = (_b = declaration.typeParameters) === null || _b === void 0 ? void 0 : _b.map((param) => createTypeParamReflection(param, context.withScope(reflection)));
        context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    }
    else if (ts.isJSDocTypedefTag(declaration) ||
        ts.isJSDocEnumTag(declaration)) {
        jsdoc_1.convertJsDocAlias(context, symbol, declaration, exportSymbol);
    }
    else {
        jsdoc_1.convertJsDocCallback(context, symbol, declaration, exportSymbol);
    }
}
function createTypeParamReflection(param, context) {
    const constraint = param.constraint
        ? context.converter.convertType(context, param.constraint)
        : void 0;
    const defaultType = param.default
        ? context.converter.convertType(context, param.default)
        : void 0;
    const paramRefl = new models_1.TypeParameterReflection(param.name.text, constraint, defaultType, context.scope);
    context.registerReflection(paramRefl, undefined);
    context.trigger(converter_events_1.ConverterEvents.CREATE_TYPE_PARAMETER, paramRefl, param);
    return paramRefl;
}
function convertFunctionOrMethod(context, symbol, exportSymbol) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    // Can't just check method flag because this might be called for properties as well
    // This will *NOT* be called for variables that look like functions, they need a special case.
    const isMethod = !!(symbol.flags &
        (ts.SymbolFlags.Property | ts.SymbolFlags.Method));
    const declarations = (_b = (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.filter(ts.isFunctionLike)) !== null && _b !== void 0 ? _b : [];
    // Don't do anything if we inherited this method and it is private.
    if (isMethod &&
        isInherited(context, symbol) &&
        declarations.length > 0 &&
        enum_1.hasAllFlags(ts.getCombinedModifierFlags(declarations[0]), ts.ModifierFlags.Private)) {
        return;
    }
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    const locationDeclaration = (_g = (_d = (_c = parentSymbol === null || parentSymbol === void 0 ? void 0 : parentSymbol.getDeclarations()) === null || _c === void 0 ? void 0 : _c.find((d) => ts.isClassDeclaration(d) || ts.isInterfaceDeclaration(d))) !== null && _d !== void 0 ? _d : (_f = (_e = parentSymbol === null || parentSymbol === void 0 ? void 0 : parentSymbol.getDeclarations()) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.getSourceFile()) !== null && _g !== void 0 ? _g : (_j = (_h = symbol.getDeclarations()) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.getSourceFile();
    assert(locationDeclaration, "Missing declaration context");
    const type = context.checker.getTypeOfSymbolAtLocation(symbol, locationDeclaration);
    // Need to get the non nullable type because interface methods might be declared
    // with a question token. See GH1490.
    const signatures = type.getNonNullableType().getCallSignatures();
    const reflection = context.createDeclarationReflection(context.scope.kindOf(models_1.ReflectionKind.ClassOrInterface |
        models_1.ReflectionKind.VariableOrProperty |
        models_1.ReflectionKind.TypeLiteral)
        ? models_1.ReflectionKind.Method
        : models_1.ReflectionKind.Function, symbol, exportSymbol, void 0);
    if (((_k = symbol.declarations) === null || _k === void 0 ? void 0 : _k.length) && isMethod) {
        // All method signatures must have the same modifier flags.
        setModifiers(symbol, symbol.declarations[0], reflection);
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    const scope = context.withScope(reflection);
    (_l = reflection.signatures) !== null && _l !== void 0 ? _l : (reflection.signatures = []);
    // Can't use zip here. We might have less declarations than signatures
    // or less signatures than declarations.
    for (let i = 0; i < signatures.length; i++) {
        signature_1.createSignature(scope, models_1.ReflectionKind.CallSignature, signatures[i], declarations[i]);
    }
}
// getDeclaredTypeOfSymbol gets the INSTANCE type
// getTypeOfSymbolAtLocation gets the STATIC type
function convertClassOrInterface(context, symbol, exportSymbol) {
    var _a, _b, _c;
    const reflection = context.createDeclarationReflection(ts.SymbolFlags.Class & symbol.flags
        ? models_1.ReflectionKind.Class
        : models_1.ReflectionKind.Interface, symbol, exportSymbol, void 0);
    const classDeclaration = (_a = symbol
        .getDeclarations()) === null || _a === void 0 ? void 0 : _a.find((d) => ts.isClassDeclaration(d) || ts.isFunctionDeclaration(d));
    if (classDeclaration)
        setModifiers(symbol, classDeclaration, reflection);
    const reflectionContext = context.withScope(reflection);
    const instanceType = context.checker.getDeclaredTypeOfSymbol(symbol);
    assert(instanceType.isClassOrInterface());
    // We might do some inheritance - do this first so that it's set when converting properties
    const declarations = (_c = (_b = symbol
        .getDeclarations()) === null || _b === void 0 ? void 0 : _b.filter((d) => ts.isInterfaceDeclaration(d) || ts.isClassDeclaration(d))) !== null && _c !== void 0 ? _c : [];
    const extendedTypes = array_1.flatMap(declarations, (decl) => {
        var _a;
        return array_1.flatMap((_a = decl.heritageClauses) !== null && _a !== void 0 ? _a : [], (clause) => {
            if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
                return [];
            }
            return clause.types.map((type) => context.converter.convertType(reflectionContext, type));
        });
    });
    if (extendedTypes.length) {
        reflection.extendedTypes = array_1.uniqueByEquals(extendedTypes);
    }
    const implementedTypes = array_1.flatMap(declarations, (decl) => {
        var _a;
        return array_1.flatMap((_a = decl.heritageClauses) !== null && _a !== void 0 ? _a : [], (clause) => {
            if (clause.token !== ts.SyntaxKind.ImplementsKeyword) {
                return [];
            }
            return clause.types.map((type) => context.converter.convertType(reflectionContext, type));
        });
    });
    if (implementedTypes.length) {
        reflection.implementedTypes = array_1.uniqueByEquals(implementedTypes);
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    if (classDeclaration) {
        // Classes can have static props
        const staticType = context.checker.getTypeOfSymbolAtLocation(symbol, classDeclaration);
        reflectionContext.shouldBeStatic = true;
        for (const prop of context.checker.getPropertiesOfType(staticType)) {
            // Don't convert namespace members, or the prototype here.
            if (prop.flags &
                (ts.SymbolFlags.ModuleMember | ts.SymbolFlags.Prototype))
                continue;
            convertSymbol(reflectionContext, prop);
        }
        reflectionContext.shouldBeStatic = false;
        const constructMember = new models_1.DeclarationReflection("constructor", models_1.ReflectionKind.Constructor, reflection);
        reflectionContext.addChild(constructMember);
        // The symbol is already taken by the class.
        context.registerReflection(constructMember, undefined);
        const ctors = staticType.getConstructSignatures();
        // Modifiers are the same for all constructors
        if (ctors.length && ctors[0].declaration) {
            setModifiers(symbol, ctors[0].declaration, constructMember);
        }
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, constructMember, ts.isClassDeclaration(classDeclaration)
            ? classDeclaration.members.find(ts.isConstructorDeclaration)
            : void 0);
        const constructContext = reflectionContext.withScope(constructMember);
        ctors.forEach((sig) => {
            signature_1.createSignature(constructContext, models_1.ReflectionKind.ConstructorSignature, sig);
        });
    }
    // Classes/interfaces usually just have properties...
    convertSymbols(reflectionContext, context.checker.getPropertiesOfType(instanceType));
    // And type arguments
    if (instanceType.typeParameters) {
        reflection.typeParameters = instanceType.typeParameters.map((param) => {
            var _a, _b;
            const declaration = (_b = (_a = param.symbol) === null || _a === void 0 ? void 0 : _a.declarations) === null || _b === void 0 ? void 0 : _b[0];
            assert(declaration && ts.isTypeParameterDeclaration(declaration));
            return createTypeParamReflection(declaration, reflectionContext);
        });
    }
    // Interfaces might also have call signatures
    // Classes might too, because of declaration merging
    context.checker
        .getSignaturesOfType(instanceType, ts.SignatureKind.Call)
        .forEach((sig) => signature_1.createSignature(reflectionContext, models_1.ReflectionKind.CallSignature, sig));
    // We also might have constructor signatures
    // This is potentially a problem with classes having multiple "constructor" members...
    // but nobody has complained yet.
    convertConstructSignatures(reflectionContext, symbol);
    // And finally, index signatures
    index_signature_1.convertIndexSignature(reflectionContext, symbol);
}
function convertProperty(context, symbol, exportSymbol) {
    var _a, _b, _c;
    const declarations = (_a = symbol.getDeclarations()) !== null && _a !== void 0 ? _a : [];
    // Don't do anything if we inherited this property and it is private.
    if (isInherited(context, symbol) &&
        declarations.length > 0 &&
        enum_1.hasAllFlags(ts.getCombinedModifierFlags(declarations[0]), ts.ModifierFlags.Private)) {
        return;
    }
    // Special case: We pretend properties are methods if they look like methods.
    // This happens with mixins / weird inheritance.
    if (declarations.every((decl) => ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl))) {
        return convertFunctionOrMethod(context, symbol, exportSymbol);
    }
    if (declarations.length === 1) {
        const declaration = declarations[0];
        // Special case: "arrow methods" should be treated as methods.
        if (ts.isPropertyDeclaration(declaration) &&
            !declaration.type &&
            declaration.initializer &&
            ts.isArrowFunction(declaration.initializer)) {
            return convertArrowAsMethod(context, symbol, declaration.initializer, exportSymbol);
        }
        // Special case: "arrow properties" in type space should be treated as methods.
        if (ts.isPropertySignature(declaration) &&
            declaration.type &&
            ts.isFunctionTypeNode(declaration.type)) {
            return convertArrowAsMethod(context, symbol, declaration.type, exportSymbol);
        }
    }
    const reflection = context.createDeclarationReflection(context.scope.kindOf(models_1.ReflectionKind.Namespace)
        ? models_1.ReflectionKind.Variable
        : models_1.ReflectionKind.Property, symbol, exportSymbol);
    const declaration = (_b = symbol.getDeclarations()) === null || _b === void 0 ? void 0 : _b[0];
    let parameterType;
    if (declaration &&
        (ts.isPropertyDeclaration(declaration) ||
            ts.isPropertySignature(declaration) ||
            ts.isParameter(declaration) ||
            ts.isPropertyAccessExpression(declaration))) {
        if (!ts.isPropertyAccessExpression(declaration)) {
            parameterType = declaration.type;
        }
        setModifiers(symbol, declaration, reflection);
    }
    reflection.defaultValue = declaration && convert_expression_1.convertDefaultValue(declaration);
    // FIXME: This is a horrible hack because getTypeOfSymbol is not exposed.
    // The right solution here is probably to keep track of parent nodes...
    // but that's tricky because not every reflection is guaranteed to have a
    // parent node. This will probably break in a future TS version.
    reflection.type = context.converter.convertType(context, (_c = (context.isConvertingTypeNode() ? parameterType : void 0)) !== null && _c !== void 0 ? _c : context.checker.getTypeOfSymbolAtLocation(symbol, {
        kind: ts.SyntaxKind.SourceFile,
    }));
    if (reflection.flags.isOptional) {
        reflection.type = reflections_1.removeUndefined(reflection.type);
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
}
function convertArrowAsMethod(context, symbol, arrow, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Method, symbol, exportSymbol, void 0);
    setModifiers(symbol, arrow.parent, reflection);
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    const rc = context.withScope(reflection);
    const signature = context.checker.getSignatureFromDeclaration(arrow);
    assert(signature);
    signature_1.createSignature(rc, models_1.ReflectionKind.CallSignature, signature, arrow);
}
function convertConstructor(context, symbol) {
    var _a, _b;
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Constructor, symbol, void 0, "constructor");
    context.finalizeDeclarationReflection(reflection, symbol);
    const reflectionContext = context.withScope(reflection);
    const declarations = (_b = (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.filter(ts.isConstructorDeclaration)) !== null && _b !== void 0 ? _b : [];
    const signatures = declarations.map((decl) => {
        const sig = context.checker.getSignatureFromDeclaration(decl);
        assert(sig);
        return sig;
    });
    for (const sig of signatures) {
        signature_1.createSignature(reflectionContext, models_1.ReflectionKind.ConstructorSignature, sig);
    }
}
function convertConstructSignatures(context, symbol) {
    const type = context.checker.getDeclaredTypeOfSymbol(symbol);
    // These get added as a "constructor" member of this interface. This is a problem... but nobody
    // has complained yet. We really ought to have a constructSignatures property on the reflection instead.
    const constructSignatures = context.checker.getSignaturesOfType(type, ts.SignatureKind.Construct);
    if (constructSignatures.length) {
        const constructMember = new models_1.DeclarationReflection("constructor", models_1.ReflectionKind.Constructor, context.scope);
        context.addChild(constructMember);
        context.registerReflection(constructMember, undefined);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, constructMember, 
        // FIXME this isn't good enough.
        context.converter.getNodesForSymbol(symbol, models_1.ReflectionKind.Constructor)[0]);
        const constructContext = context.withScope(constructMember);
        constructSignatures.forEach((sig) => signature_1.createSignature(constructContext, models_1.ReflectionKind.ConstructorSignature, sig));
    }
}
function convertAlias(context, symbol, exportSymbol) {
    const reflection = context.project.getReflectionFromSymbol(context.resolveAliasedSymbol(symbol));
    if (!reflection) {
        // We don't have this, convert it.
        convertSymbol(context, context.resolveAliasedSymbol(symbol), exportSymbol !== null && exportSymbol !== void 0 ? exportSymbol : symbol);
    }
    else {
        createAlias(reflection, context, symbol, exportSymbol);
    }
}
function createAlias(target, context, symbol, exportSymbol) {
    var _a;
    // We already have this. Create a reference.
    const ref = new models_1.ReferenceReflection((_a = exportSymbol === null || exportSymbol === void 0 ? void 0 : exportSymbol.name) !== null && _a !== void 0 ? _a : symbol.name, target, context.scope);
    context.addChild(ref);
    context.registerReflection(ref, symbol);
    context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, ref, 
    // FIXME this isn't good enough.
    context.converter.getNodesForSymbol(symbol, models_1.ReflectionKind.Reference)[0]);
}
function convertVariable(context, symbol, exportSymbol) {
    var _a;
    const declaration = (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a[0];
    assert(declaration);
    const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);
    if (type.getCallSignatures().length && !type.getProperties().length) {
        return convertVariableAsFunction(context, symbol, exportSymbol);
    }
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Variable, symbol, exportSymbol);
    let typeNode;
    if (ts.isVariableDeclaration(declaration)) {
        // Otherwise we might have destructuring
        typeNode = declaration.type;
    }
    reflection.type = context.converter.convertType(context.withScope(reflection), typeNode !== null && typeNode !== void 0 ? typeNode : type);
    setModifiers(symbol, declaration, reflection);
    // Does anyone care about this? I doubt it...
    if (ts.isVariableDeclaration(declaration) &&
        enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.BlockScopedVariable)) {
        reflection.setFlag(models_1.ReflectionFlag.Const, enum_1.hasAllFlags(declaration.parent.flags, ts.NodeFlags.Const));
    }
    reflection.defaultValue = convert_expression_1.convertDefaultValue(declaration);
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
}
function convertVariableAsFunction(context, symbol, exportSymbol) {
    var _a, _b;
    const declaration = (_a = symbol
        .getDeclarations()) === null || _a === void 0 ? void 0 : _a.find(ts.isVariableDeclaration);
    const accessDeclaration = declaration !== null && declaration !== void 0 ? declaration : symbol.valueDeclaration;
    const type = accessDeclaration
        ? context.checker.getTypeOfSymbolAtLocation(symbol, accessDeclaration)
        : context.checker.getDeclaredTypeOfSymbol(symbol);
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Function, symbol, exportSymbol);
    setModifiers(symbol, accessDeclaration, reflection);
    // Does anyone care about this? I doubt it...
    if (declaration &&
        enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.BlockScopedVariable)) {
        reflection.setFlag(models_1.ReflectionFlag.Const, enum_1.hasAllFlags((declaration || symbol.valueDeclaration).parent.flags, ts.NodeFlags.Const));
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    const reflectionContext = context.withScope(reflection);
    (_b = reflection.signatures) !== null && _b !== void 0 ? _b : (reflection.signatures = []);
    for (const signature of type.getCallSignatures()) {
        signature_1.createSignature(reflectionContext, models_1.ReflectionKind.CallSignature, signature, void 0, declaration);
    }
}
function convertAccessor(context, symbol, exportSymbol) {
    var _a, _b, _c;
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Accessor, symbol, exportSymbol);
    const rc = context.withScope(reflection);
    const declaration = (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a[0];
    if (declaration) {
        setModifiers(symbol, declaration, reflection);
    }
    context.finalizeDeclarationReflection(reflection, symbol, exportSymbol);
    const getDeclaration = (_b = symbol.getDeclarations()) === null || _b === void 0 ? void 0 : _b.find(ts.isGetAccessor);
    if (getDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(getDeclaration);
        if (signature) {
            signature_1.createSignature(rc, models_1.ReflectionKind.GetSignature, signature, getDeclaration);
        }
    }
    const setDeclaration = (_c = symbol.getDeclarations()) === null || _c === void 0 ? void 0 : _c.find(ts.isSetAccessor);
    if (setDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(setDeclaration);
        if (signature) {
            signature_1.createSignature(rc, models_1.ReflectionKind.SetSignature, signature, setDeclaration);
        }
    }
}
function isInherited(context, symbol) {
    var _a;
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    assert(parentSymbol);
    return (((_a = parentSymbol
        .getDeclarations()) === null || _a === void 0 ? void 0 : _a.some((d) => { var _a; return (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.some((d2) => d2.parent === d); })) === false);
}
function setModifiers(symbol, declaration, reflection) {
    var _a;
    if (!declaration) {
        return;
    }
    const modifiers = ts.getCombinedModifierFlags(declaration);
    if (ts.isMethodDeclaration(declaration) ||
        ts.isPropertyDeclaration(declaration) ||
        ts.isAccessor(declaration)) {
        if (ts.isPrivateIdentifier(declaration.name)) {
            reflection.setFlag(models_1.ReflectionFlag.Private);
        }
    }
    if (enum_1.hasAllFlags(modifiers, ts.ModifierFlags.Private)) {
        reflection.setFlag(models_1.ReflectionFlag.Private);
    }
    if (enum_1.hasAllFlags(modifiers, ts.ModifierFlags.Protected)) {
        reflection.setFlag(models_1.ReflectionFlag.Protected);
    }
    if (enum_1.hasAllFlags(modifiers, ts.ModifierFlags.Public)) {
        reflection.setFlag(models_1.ReflectionFlag.Public);
    }
    reflection.setFlag(models_1.ReflectionFlag.Optional, enum_1.hasAllFlags(symbol.flags, ts.SymbolFlags.Optional));
    reflection.setFlag(models_1.ReflectionFlag.Readonly, enum_1.hasAllFlags((_a = symbol.checkFlags) !== null && _a !== void 0 ? _a : 0, ts.CheckFlags.Readonly) ||
        enum_1.hasAllFlags(modifiers, ts.ModifierFlags.Readonly));
    reflection.setFlag(models_1.ReflectionFlag.Abstract, enum_1.hasAllFlags(modifiers, ts.ModifierFlags.Abstract));
    // ReflectionFlag.Static happens when constructing the reflection.
    // We don't have sufficient information here to determine if it ought to be static.
}
