"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertType = exports.loadConverters = void 0;
const assert = require("assert");
const ts = require("typescript");
const models_1 = require("../models");
const optional_1 = require("../models/types/optional");
const rest_1 = require("../models/types/rest");
const template_literal_1 = require("../models/types/template-literal");
const array_1 = require("../utils/array");
const converter_events_1 = require("./converter-events");
const index_signature_1 = require("./factories/index-signature");
const signature_1 = require("./factories/signature");
const symbols_1 = require("./symbols");
const reflections_1 = require("./utils/reflections");
const converters = new Map();
function loadConverters() {
    if (converters.size)
        return;
    for (const actor of [
        arrayConverter,
        conditionalConverter,
        constructorConverter,
        exprWithTypeArgsConverter,
        functionTypeConverter,
        importType,
        indexedAccessConverter,
        inferredConverter,
        intersectionConverter,
        jsDocVariadicTypeConverter,
        keywordConverter,
        optionalConverter,
        parensConverter,
        predicateConverter,
        queryConverter,
        typeLiteralConverter,
        referenceConverter,
        restConverter,
        namedTupleMemberConverter,
        mappedConverter,
        ts3LiteralBooleanConverter,
        ts3LiteralNullConverter,
        ts3LiteralThisConverter,
        literalTypeConverter,
        templateLiteralConverter,
        thisConverter,
        tupleConverter,
        typeOperatorConverter,
        unionConverter,
        // Only used if skipLibCheck: true
        jsDocNullableTypeConverter,
        jsDocNonNullableTypeConverter,
    ]) {
        for (const key of actor.kind) {
            if (key === undefined) {
                // Might happen if running on an older TS version.
                continue;
            }
            assert(!converters.has(key));
            converters.set(key, actor);
        }
    }
}
exports.loadConverters = loadConverters;
// This ought not be necessary, but we need some way to discover recursively
// typed symbols which do not have type nodes. See the `recursive` symbol in the variables test.
const seenTypeSymbols = new Set();
function convertType(context, typeOrNode) {
    if (!typeOrNode) {
        return new models_1.IntrinsicType("any");
    }
    loadConverters();
    if ("kind" in typeOrNode) {
        const converter = converters.get(typeOrNode.kind);
        if (converter) {
            return converter.convert(context, typeOrNode);
        }
        return requestBugReport(context, typeOrNode);
    }
    // IgnoreErrors is important, without it, we can't assert that we will get a node.
    const node = context.checker.typeToTypeNode(typeOrNode, void 0, ts.NodeBuilderFlags.IgnoreErrors);
    assert(node); // According to the TS source of typeToString, this is a bug if it does not hold.
    const symbol = typeOrNode.getSymbol();
    if (symbol) {
        if (node.kind !== ts.SyntaxKind.TypeReference &&
            node.kind !== ts.SyntaxKind.ArrayType &&
            seenTypeSymbols.has(symbol)) {
            const typeString = context.checker.typeToString(typeOrNode);
            context.logger.verbose(`Refusing to recurse when converting type: ${typeString}`);
            return new models_1.UnknownType(typeString);
        }
        seenTypeSymbols.add(symbol);
    }
    const converter = converters.get(node.kind);
    if (converter) {
        const result = converter.convertType(context, typeOrNode, node);
        if (symbol)
            seenTypeSymbols.delete(symbol);
        return result;
    }
    return requestBugReport(context, typeOrNode);
}
exports.convertType = convertType;
const arrayConverter = {
    kind: [ts.SyntaxKind.ArrayType],
    convert(context, node) {
        return new models_1.ArrayType(convertType(context, node.elementType));
    },
    convertType(context, type) {
        const params = context.checker.getTypeArguments(type);
        // This is *almost* always true... except for when this type is in the constraint of a type parameter see GH#1408
        // assert(params.length === 1);
        assert(params.length > 0);
        return new models_1.ArrayType(convertType(context, params[0]));
    },
};
const conditionalConverter = {
    kind: [ts.SyntaxKind.ConditionalType],
    convert(context, node) {
        return new models_1.ConditionalType(convertType(context, node.checkType), convertType(context, node.extendsType), convertType(context, node.trueType), convertType(context, node.falseType));
    },
    convertType(context, type) {
        return new models_1.ConditionalType(convertType(context, type.checkType), convertType(context, type.extendsType), convertType(context, type.resolvedTrueType), convertType(context, type.resolvedFalseType));
    },
};
const constructorConverter = {
    kind: [ts.SyntaxKind.ConstructorType],
    convert(context, node) {
        var _a, _b;
        const symbol = (_a = context.getSymbolAtLocation(node)) !== null && _a !== void 0 ? _a : node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new models_1.IntrinsicType("Function");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.Constructor, context.scope);
        const rc = context.withScope(reflection);
        rc.setConvertingTypeNode();
        context.registerReflection(reflection, symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection, node);
        const signature = new models_1.SignatureReflection("__type", models_1.ReflectionKind.ConstructorSignature, reflection);
        // This is unfortunate... but seems the obvious place to put this with the current
        // architecture. Ideally, this would be a property on a "ConstructorType"... but that
        // needs to wait until TypeDoc 0.22 when making other breaking changes.
        if ((_b = node.modifiers) === null || _b === void 0 ? void 0 : _b.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)) {
            signature.setFlag(models_1.ReflectionFlag.Abstract);
        }
        context.registerReflection(signature, void 0);
        const signatureCtx = rc.withScope(signature);
        reflection.signatures = [signature];
        signature.type = convertType(signatureCtx, node.type);
        signature.parameters = signature_1.convertParameterNodes(signatureCtx, signature, node.parameters);
        signature.typeParameters = signature_1.convertTypeParameterNodes(signatureCtx, node.typeParameters);
        return new models_1.ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new models_1.IntrinsicType("Function");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.Constructor, context.scope);
        context.registerReflection(reflection, type.symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection);
        signature_1.createSignature(context.withScope(reflection), models_1.ReflectionKind.ConstructorSignature, type.getConstructSignatures()[0]);
        return new models_1.ReflectionType(reflection);
    },
};
const exprWithTypeArgsConverter = {
    kind: [ts.SyntaxKind.ExpressionWithTypeArguments],
    convert(context, node) {
        var _a, _b;
        const targetSymbol = context.getSymbolAtLocation(node.expression);
        // Mixins... we might not have a symbol here.
        if (!targetSymbol) {
            return convertType(context, context.checker.getTypeAtLocation(node));
        }
        const parameters = (_b = (_a = node.typeArguments) === null || _a === void 0 ? void 0 : _a.map((type) => convertType(context, type))) !== null && _b !== void 0 ? _b : [];
        const ref = new models_1.ReferenceType(targetSymbol.name, context.resolveAliasedSymbol(targetSymbol), context.project);
        ref.typeArguments = parameters;
        return ref;
    },
    convertType: requestBugReport,
};
const functionTypeConverter = {
    kind: [ts.SyntaxKind.FunctionType],
    convert(context, node) {
        var _a;
        const symbol = (_a = context.getSymbolAtLocation(node)) !== null && _a !== void 0 ? _a : node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new models_1.IntrinsicType("Function");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.TypeLiteral, context.scope);
        const rc = context.withScope(reflection);
        context.registerReflection(reflection, symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection, node);
        const signature = new models_1.SignatureReflection("__type", models_1.ReflectionKind.CallSignature, reflection);
        context.registerReflection(signature, void 0);
        const signatureCtx = rc.withScope(signature);
        reflection.signatures = [signature];
        signature.type = convertType(signatureCtx, node.type);
        signature.parameters = signature_1.convertParameterNodes(signatureCtx, signature, node.parameters);
        signature.typeParameters = signature_1.convertTypeParameterNodes(signatureCtx, node.typeParameters);
        return new models_1.ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new models_1.IntrinsicType("Function");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.TypeLiteral, context.scope);
        context.registerReflection(reflection, type.symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection);
        signature_1.createSignature(context.withScope(reflection), models_1.ReflectionKind.CallSignature, type.getCallSignatures()[0]);
        return new models_1.ReflectionType(reflection);
    },
};
const importType = {
    kind: [ts.SyntaxKind.ImportType],
    convert(context, node) {
        var _a, _b;
        const name = (_b = (_a = node.qualifier) === null || _a === void 0 ? void 0 : _a.getText()) !== null && _b !== void 0 ? _b : "__module";
        const symbol = context.checker.getSymbolAtLocation(node);
        assert(symbol, "Missing symbol when converting import type node");
        return new models_1.ReferenceType(name, symbol, context.project);
    },
    convertType(context, type) {
        const symbol = type.getSymbol();
        assert(symbol, "Missing symbol when converting import type"); // Should be a compiler error
        return new models_1.ReferenceType("__module", symbol, context.project);
    },
};
const indexedAccessConverter = {
    kind: [ts.SyntaxKind.IndexedAccessType],
    convert(context, node) {
        return new models_1.IndexedAccessType(convertType(context, node.objectType), convertType(context, node.indexType));
    },
    convertType(context, type) {
        return new models_1.IndexedAccessType(convertType(context, type.objectType), convertType(context, type.indexType));
    },
};
const inferredConverter = {
    kind: [ts.SyntaxKind.InferType],
    convert(_context, node) {
        return new models_1.InferredType(node.typeParameter.getText());
    },
    convertType(_context, type) {
        return new models_1.InferredType(type.symbol.name);
    },
};
const intersectionConverter = {
    kind: [ts.SyntaxKind.IntersectionType],
    convert(context, node) {
        return new models_1.IntersectionType(node.types.map((type) => convertType(context, type)));
    },
    convertType(context, type) {
        return new models_1.IntersectionType(type.types.map((type) => convertType(context, type)));
    },
};
const jsDocVariadicTypeConverter = {
    kind: [ts.SyntaxKind.JSDocVariadicType],
    convert(context, node) {
        return new models_1.ArrayType(convertType(context, node.type));
    },
    // Should just be an ArrayType
    convertType: requestBugReport,
};
const keywordNames = {
    [ts.SyntaxKind.AnyKeyword]: "any",
    [ts.SyntaxKind.BigIntKeyword]: "bigint",
    [ts.SyntaxKind.BooleanKeyword]: "boolean",
    [ts.SyntaxKind.NeverKeyword]: "never",
    [ts.SyntaxKind.NumberKeyword]: "number",
    [ts.SyntaxKind.ObjectKeyword]: "object",
    [ts.SyntaxKind.StringKeyword]: "string",
    [ts.SyntaxKind.SymbolKeyword]: "symbol",
    [ts.SyntaxKind.UndefinedKeyword]: "undefined",
    [ts.SyntaxKind.UnknownKeyword]: "unknown",
    [ts.SyntaxKind.VoidKeyword]: "void",
    [ts.SyntaxKind.IntrinsicKeyword]: "intrinsic",
};
const keywordConverter = {
    kind: [
        ts.SyntaxKind.AnyKeyword,
        ts.SyntaxKind.BigIntKeyword,
        ts.SyntaxKind.BooleanKeyword,
        ts.SyntaxKind.NeverKeyword,
        ts.SyntaxKind.NumberKeyword,
        ts.SyntaxKind.ObjectKeyword,
        ts.SyntaxKind.StringKeyword,
        ts.SyntaxKind.SymbolKeyword,
        ts.SyntaxKind.UndefinedKeyword,
        ts.SyntaxKind.UnknownKeyword,
        ts.SyntaxKind.VoidKeyword,
    ],
    convert(_context, node) {
        return new models_1.IntrinsicType(keywordNames[node.kind]);
    },
    convertType(_context, _type, node) {
        return new models_1.IntrinsicType(keywordNames[node.kind]);
    },
};
const optionalConverter = {
    kind: [ts.SyntaxKind.OptionalType],
    convert(context, node) {
        return new optional_1.OptionalType(reflections_1.removeUndefined(convertType(context, node.type)));
    },
    // Handled by the tuple converter
    convertType: requestBugReport,
};
const parensConverter = {
    kind: [ts.SyntaxKind.ParenthesizedType],
    convert(context, node) {
        return convertType(context, node.type);
    },
    // TS strips these out too... shouldn't run into this.
    convertType: requestBugReport,
};
const predicateConverter = {
    kind: [ts.SyntaxKind.TypePredicate],
    convert(context, node) {
        const name = ts.isThisTypeNode(node.parameterName)
            ? "this"
            : node.parameterName.getText();
        const asserts = !!node.assertsModifier;
        const targetType = node.type ? convertType(context, node.type) : void 0;
        return new models_1.PredicateType(name, asserts, targetType);
    },
    // Never inferred by TS 4.0, could potentially change in a future TS version.
    convertType: requestBugReport,
};
// This is a horrible thing... we're going to want to split this into converters
// for different types at some point.
const typeLiteralConverter = {
    kind: [ts.SyntaxKind.TypeLiteral],
    convert(context, node) {
        var _a;
        const symbol = (_a = context.getSymbolAtLocation(node)) !== null && _a !== void 0 ? _a : node.symbol;
        const type = context.getTypeAtLocation(node);
        if (!symbol || !type) {
            return new models_1.IntrinsicType("Object");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.TypeLiteral, context.scope);
        const rc = context.withScope(reflection);
        rc.setConvertingTypeNode();
        context.registerReflection(reflection, symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection, node);
        for (const prop of context.checker.getPropertiesOfType(type)) {
            symbols_1.convertSymbol(rc, prop);
        }
        for (const signature of type.getCallSignatures()) {
            signature_1.createSignature(rc, models_1.ReflectionKind.CallSignature, signature);
        }
        index_signature_1.convertIndexSignature(rc, symbol);
        return new models_1.ReflectionType(reflection);
    },
    convertType(context, type) {
        if (!type.symbol) {
            return new models_1.IntrinsicType("Object");
        }
        const reflection = new models_1.DeclarationReflection("__type", models_1.ReflectionKind.TypeLiteral, context.scope);
        context.registerReflection(reflection, type.symbol);
        context.trigger(converter_events_1.ConverterEvents.CREATE_DECLARATION, reflection);
        for (const prop of context.checker.getPropertiesOfType(type)) {
            symbols_1.convertSymbol(context.withScope(reflection), prop);
        }
        for (const signature of type.getCallSignatures()) {
            signature_1.createSignature(context.withScope(reflection), models_1.ReflectionKind.CallSignature, signature);
        }
        index_signature_1.convertIndexSignature(context.withScope(reflection), type.symbol);
        return new models_1.ReflectionType(reflection);
    },
};
const queryConverter = {
    kind: [ts.SyntaxKind.TypeQuery],
    convert(context, node) {
        const querySymbol = context.expectSymbolAtLocation(node.exprName);
        return new models_1.QueryType(new models_1.ReferenceType(node.exprName.getText(), context.resolveAliasedSymbol(querySymbol), context.project));
    },
    convertType(context, type) {
        const symbol = type.getSymbol();
        assert(symbol, `Query type failed to get a symbol for: ${context.checker.typeToString(type)}. This is a bug.`);
        return new models_1.QueryType(new models_1.ReferenceType(symbol.name, context.resolveAliasedSymbol(symbol), context.project));
    },
};
const referenceConverter = {
    kind: [ts.SyntaxKind.TypeReference],
    convert(context, node) {
        var _a, _b, _c;
        const isArray = ((_a = context.checker.typeToTypeNode(context.checker.getTypeAtLocation(node.typeName), void 0, ts.NodeBuilderFlags.IgnoreErrors)) === null || _a === void 0 ? void 0 : _a.kind) === ts.SyntaxKind.ArrayType;
        if (isArray) {
            return new models_1.ArrayType(convertType(context, (_b = node.typeArguments) === null || _b === void 0 ? void 0 : _b[0]));
        }
        const symbol = context.expectSymbolAtLocation(node.typeName);
        const name = node.typeName.getText();
        const type = new models_1.ReferenceType(name, context.resolveAliasedSymbol(symbol), context.project);
        type.typeArguments = (_c = node.typeArguments) === null || _c === void 0 ? void 0 : _c.map((type) => convertType(context, type));
        return type;
    },
    convertType(context, type) {
        var _a, _b;
        const symbol = (_a = type.aliasSymbol) !== null && _a !== void 0 ? _a : type.getSymbol();
        if (!symbol) {
            // This happens when we get a reference to a type parameter
            // created within a mapped type, `K` in: `{ [K in T]: string }`
            return models_1.ReferenceType.createBrokenReference(context.checker.typeToString(type), context.project);
        }
        const ref = new models_1.ReferenceType(symbol.name, context.resolveAliasedSymbol(symbol), context.project);
        ref.typeArguments = (_b = (type.aliasSymbol ? type.aliasTypeArguments : type.typeArguments)) === null || _b === void 0 ? void 0 : _b.map((ref) => convertType(context, ref));
        return ref;
    },
};
const restConverter = {
    kind: [ts.SyntaxKind.RestType],
    convert(context, node) {
        return new rest_1.RestType(convertType(context, node.type));
    },
    // This is handled in the tuple converter
    convertType: requestBugReport,
};
const namedTupleMemberConverter = {
    kind: [ts.SyntaxKind.NamedTupleMember],
    convert(context, node) {
        const innerType = convertType(context, node.type);
        return new models_1.NamedTupleMember(node.name.getText(), !!node.questionToken, innerType);
    },
    // This ought to be impossible.
    convertType: requestBugReport,
};
// { -readonly [K in string]-?: number}
//   ^ readonlyToken
//              ^ typeParameter
//                   ^^^^^^ typeParameter.constraint
//                          ^ questionToken
//                              ^^^^^^ type
const mappedConverter = {
    kind: [ts.SyntaxKind.MappedType],
    convert(context, node) {
        var _a, _b;
        const optionalModifier = kindToModifier((_a = node.questionToken) === null || _a === void 0 ? void 0 : _a.kind);
        const templateType = convertType(context, node.type);
        return new models_1.MappedType(node.typeParameter.name.text, convertType(context, node.typeParameter.constraint), optionalModifier === "+"
            ? reflections_1.removeUndefined(templateType)
            : templateType, kindToModifier((_b = node.readonlyToken) === null || _b === void 0 ? void 0 : _b.kind), optionalModifier, node.nameType ? convertType(context, node.nameType) : void 0);
    },
    convertType(context, type, node) {
        var _a, _b, _c;
        // This can happen if a generic function does not have a return type annotated.
        const optionalModifier = kindToModifier((_a = node.questionToken) === null || _a === void 0 ? void 0 : _a.kind);
        const templateType = convertType(context, type.templateType);
        return new models_1.MappedType((_b = type.typeParameter.symbol) === null || _b === void 0 ? void 0 : _b.name, convertType(context, type.typeParameter.getConstraint()), optionalModifier === "+"
            ? reflections_1.removeUndefined(templateType)
            : templateType, kindToModifier((_c = node.readonlyToken) === null || _c === void 0 ? void 0 : _c.kind), optionalModifier, type.nameType ? convertType(context, type.nameType) : void 0);
    },
};
const ts3LiteralBooleanConverter = {
    kind: [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword],
    convert(_context, node) {
        return new models_1.LiteralType(node.kind === ts.SyntaxKind.TrueKeyword);
    },
    convertType(_context, _type, node) {
        return new models_1.LiteralType(node.kind === ts.SyntaxKind.TrueKeyword);
    },
};
const ts3LiteralNullConverter = {
    kind: [ts.SyntaxKind.NullKeyword],
    convert() {
        return new models_1.LiteralType(null);
    },
    convertType() {
        return new models_1.LiteralType(null);
    },
};
const ts3LiteralThisConverter = {
    kind: [ts.SyntaxKind.ThisKeyword],
    convert() {
        return new models_1.IntrinsicType("this");
    },
    convertType() {
        return new models_1.IntrinsicType("this");
    },
};
const literalTypeConverter = {
    kind: [ts.SyntaxKind.LiteralType],
    convert(context, node) {
        switch (node.literal.kind) {
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return new models_1.LiteralType(node.literal.kind === ts.SyntaxKind.TrueKeyword);
            case ts.SyntaxKind.StringLiteral:
                return new models_1.LiteralType(node.literal.text);
            case ts.SyntaxKind.NumericLiteral:
                return new models_1.LiteralType(Number(node.literal.text));
            case ts.SyntaxKind.NullKeyword:
                return new models_1.LiteralType(null);
            case ts.SyntaxKind.PrefixUnaryExpression: {
                const operand = node.literal
                    .operand;
                switch (operand.kind) {
                    case ts.SyntaxKind.NumericLiteral:
                        return new models_1.LiteralType(Number(node.literal.getText()));
                    case ts.SyntaxKind.BigIntLiteral:
                        return new models_1.LiteralType(BigInt(node.literal.getText().replace("n", "")));
                    default:
                        return requestBugReport(context, node.literal);
                }
            }
            case ts.SyntaxKind.BigIntLiteral:
                return new models_1.LiteralType(BigInt(node.literal.getText().replace("n", "")));
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                return new models_1.LiteralType(node.literal.text);
        }
        return requestBugReport(context, node.literal);
    },
    convertType(_context, type, node) {
        switch (node.literal.kind) {
            case ts.SyntaxKind.StringLiteral:
                return new models_1.LiteralType(node.literal.text);
            case ts.SyntaxKind.NumericLiteral:
                return new models_1.LiteralType(+node.literal.text);
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return new models_1.LiteralType(node.literal.kind === ts.SyntaxKind.TrueKeyword);
            case ts.SyntaxKind.NullKeyword:
                return new models_1.LiteralType(null);
        }
        if (typeof type.value === "object") {
            return new models_1.LiteralType(BigInt(`${type.value.negative ? "-" : ""}${type.value.base10Value}`));
        }
        return new models_1.LiteralType(type.value);
    },
};
const templateLiteralConverter = {
    kind: [ts.SyntaxKind.TemplateLiteralType],
    convert(context, node) {
        return new template_literal_1.TemplateLiteralType(node.head.text, node.templateSpans.map((span) => {
            return [convertType(context, span.type), span.literal.text];
        }));
    },
    convertType(context, type) {
        assert(type.texts.length === type.types.length + 1);
        const parts = [];
        for (const [a, b] of array_1.zip(type.types, type.texts.slice(1))) {
            parts.push([convertType(context, a), b]);
        }
        return new template_literal_1.TemplateLiteralType(type.texts[0], parts);
    },
};
const thisConverter = {
    kind: [ts.SyntaxKind.ThisType],
    convert() {
        return new models_1.IntrinsicType("this");
    },
    convertType() {
        return new models_1.IntrinsicType("this");
    },
};
const tupleConverter = {
    kind: [ts.SyntaxKind.TupleType],
    convert(context, node) {
        const elements = node.elements.map((node) => convertType(context, node));
        return new models_1.TupleType(elements);
    },
    convertType(context, type, node) {
        var _a;
        const types = (_a = type.typeArguments) === null || _a === void 0 ? void 0 : _a.slice(0, node.elements.length);
        let elements = types === null || types === void 0 ? void 0 : types.map((type) => convertType(context, type));
        if (type.target.labeledElementDeclarations) {
            const namedDeclarations = type.target.labeledElementDeclarations;
            elements = elements === null || elements === void 0 ? void 0 : elements.map((el, i) => new models_1.NamedTupleMember(namedDeclarations[i].name.getText(), !!namedDeclarations[i].questionToken, reflections_1.removeUndefined(el)));
        }
        elements = elements === null || elements === void 0 ? void 0 : elements.map((el, i) => {
            if (type.target.elementFlags[i] & ts.ElementFlags.Variable) {
                // In the node case, we don't need to add the wrapping Array type... but we do here.
                if (el instanceof models_1.NamedTupleMember) {
                    return new rest_1.RestType(new models_1.NamedTupleMember(el.name, el.isOptional, new models_1.ArrayType(el.element)));
                }
                return new rest_1.RestType(new models_1.ArrayType(el));
            }
            if (type.target.elementFlags[i] & ts.ElementFlags.Optional &&
                !(el instanceof models_1.NamedTupleMember)) {
                return new optional_1.OptionalType(reflections_1.removeUndefined(el));
            }
            return el;
        });
        return new models_1.TupleType(elements !== null && elements !== void 0 ? elements : []);
    },
};
const supportedOperatorNames = {
    [ts.SyntaxKind.KeyOfKeyword]: "keyof",
    [ts.SyntaxKind.UniqueKeyword]: "unique",
    [ts.SyntaxKind.ReadonlyKeyword]: "readonly",
};
const typeOperatorConverter = {
    kind: [ts.SyntaxKind.TypeOperator],
    convert(context, node) {
        return new models_1.TypeOperatorType(convertType(context, node.type), supportedOperatorNames[node.operator]);
    },
    convertType(context, type, node) {
        // readonly is only valid on array and tuple literal types.
        if (node.operator === ts.SyntaxKind.ReadonlyKeyword) {
            const resolved = resolveReference(type);
            assert(isObjectType(resolved));
            const args = context.checker
                .getTypeArguments(type)
                .map((type) => convertType(context, type));
            const inner = resolved.objectFlags & ts.ObjectFlags.Tuple
                ? new models_1.TupleType(args)
                : new models_1.ArrayType(args[0]);
            return new models_1.TypeOperatorType(inner, "readonly");
        }
        // keyof will only show up with generic functions, otherwise it gets eagerly
        // resolved to a union of strings.
        if (node.operator === ts.SyntaxKind.KeyOfKeyword) {
            // TS 4.2 added this to enable better tracking of type aliases.
            if (type.isUnion() && type.origin) {
                return convertType(context, type.origin);
            }
            // There's probably an interface for this somewhere... I couldn't find it.
            const targetType = type.type;
            return new models_1.TypeOperatorType(convertType(context, targetType), "keyof");
        }
        // TS drops `unique` in `unique symbol` everywhere. If someone used it, we ought
        // to have a type node. This shouldn't ever happen.
        return requestBugReport(context, type);
    },
};
const unionConverter = {
    kind: [ts.SyntaxKind.UnionType],
    convert(context, node) {
        return new models_1.UnionType(node.types.map((type) => convertType(context, type)));
    },
    convertType(context, type) {
        // TS 4.2 added this to enable better tracking of type aliases.
        if (type.origin) {
            return convertType(context, type.origin);
        }
        return new models_1.UnionType(type.types.map((type) => convertType(context, type)));
    },
};
const jsDocNullableTypeConverter = {
    kind: [ts.SyntaxKind.JSDocNullableType],
    convert(context, node) {
        return new models_1.UnionType([
            convertType(context, node.type),
            new models_1.LiteralType(null),
        ]);
    },
    // Should be a UnionType
    convertType: requestBugReport,
};
const jsDocNonNullableTypeConverter = {
    kind: [ts.SyntaxKind.JSDocNonNullableType],
    convert(context, node) {
        return convertType(context, node.type);
    },
    // Should be a UnionType
    convertType: requestBugReport,
};
function requestBugReport(context, nodeOrType) {
    if ("kind" in nodeOrType) {
        const kindName = ts.SyntaxKind[nodeOrType.kind];
        const { line, character } = ts.getLineAndCharacterOfPosition(nodeOrType.getSourceFile(), nodeOrType.pos);
        context.logger.warn(`Failed to convert type node with kind: ${kindName} and text ${nodeOrType.getText()}. Please report a bug.\n\t` +
            `${nodeOrType.getSourceFile().fileName}:${line + 1}:${character}`);
        return new models_1.UnknownType(nodeOrType.getText());
    }
    else {
        const typeString = context.checker.typeToString(nodeOrType);
        context.logger.warn(`Failed to convert type: ${typeString} when converting ${context.scope.getFullName()}. Please report a bug.`);
        return new models_1.UnknownType(typeString);
    }
}
function isObjectType(type) {
    return typeof type.objectFlags === "number";
}
function resolveReference(type) {
    if (isObjectType(type) && type.objectFlags & ts.ObjectFlags.Reference) {
        return type.target;
    }
    return type;
}
function kindToModifier(kind) {
    switch (kind) {
        case ts.SyntaxKind.ReadonlyKeyword:
        case ts.SyntaxKind.QuestionToken:
        case ts.SyntaxKind.PlusToken:
            return "+";
        case ts.SyntaxKind.MinusToken:
            return "-";
        default:
            return undefined;
    }
}
