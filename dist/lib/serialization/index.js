"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONOutput = exports.UnknownTypeSerializer = exports.TypeSerializer = exports.TypeParameterTypeSerializer = exports.TypeParameterReflectionSerializer = exports.TypeOperatorTypeSerializer = exports.TupleTypeSerializer = exports.SourceReferenceWrapper = exports.SourceReferenceContainerSerializer = exports.SignatureReflectionSerializer = exports.ReflectionTypeSerializer = exports.ReflectionSerializer = exports.ReflectionGroupSerializer = exports.ReflectionCategorySerializer = exports.ReferenceTypeSerializer = exports.ParameterReflectionSerializer = exports.LiteralTypeSerializer = exports.IntrinsicTypeSerializer = exports.IntersectionTypeSerializer = exports.DecoratorWrapper = exports.DecoratorContainerSerializer = exports.DeclarationReflectionSerializer = exports.ContainerReflectionSerializer = exports.CommentTagSerializer = exports.CommentSerializer = exports.ArrayTypeSerializer = exports.Serializer = exports.SerializeEvent = exports.TypeSerializerComponent = exports.SerializerComponent = exports.ReflectionSerializerComponent = void 0;
var components_1 = require("./components");
Object.defineProperty(exports, "ReflectionSerializerComponent", { enumerable: true, get: function () { return components_1.ReflectionSerializerComponent; } });
Object.defineProperty(exports, "SerializerComponent", { enumerable: true, get: function () { return components_1.SerializerComponent; } });
Object.defineProperty(exports, "TypeSerializerComponent", { enumerable: true, get: function () { return components_1.TypeSerializerComponent; } });
var events_1 = require("./events");
Object.defineProperty(exports, "SerializeEvent", { enumerable: true, get: function () { return events_1.SerializeEvent; } });
var serializer_1 = require("./serializer");
Object.defineProperty(exports, "Serializer", { enumerable: true, get: function () { return serializer_1.Serializer; } });
var serializers_1 = require("./serializers");
Object.defineProperty(exports, "ArrayTypeSerializer", { enumerable: true, get: function () { return serializers_1.ArrayTypeSerializer; } });
Object.defineProperty(exports, "CommentSerializer", { enumerable: true, get: function () { return serializers_1.CommentSerializer; } });
Object.defineProperty(exports, "CommentTagSerializer", { enumerable: true, get: function () { return serializers_1.CommentTagSerializer; } });
Object.defineProperty(exports, "ContainerReflectionSerializer", { enumerable: true, get: function () { return serializers_1.ContainerReflectionSerializer; } });
Object.defineProperty(exports, "DeclarationReflectionSerializer", { enumerable: true, get: function () { return serializers_1.DeclarationReflectionSerializer; } });
Object.defineProperty(exports, "DecoratorContainerSerializer", { enumerable: true, get: function () { return serializers_1.DecoratorContainerSerializer; } });
Object.defineProperty(exports, "DecoratorWrapper", { enumerable: true, get: function () { return serializers_1.DecoratorWrapper; } });
Object.defineProperty(exports, "IntersectionTypeSerializer", { enumerable: true, get: function () { return serializers_1.IntersectionTypeSerializer; } });
Object.defineProperty(exports, "IntrinsicTypeSerializer", { enumerable: true, get: function () { return serializers_1.IntrinsicTypeSerializer; } });
Object.defineProperty(exports, "LiteralTypeSerializer", { enumerable: true, get: function () { return serializers_1.LiteralTypeSerializer; } });
Object.defineProperty(exports, "ParameterReflectionSerializer", { enumerable: true, get: function () { return serializers_1.ParameterReflectionSerializer; } });
Object.defineProperty(exports, "ReferenceTypeSerializer", { enumerable: true, get: function () { return serializers_1.ReferenceTypeSerializer; } });
Object.defineProperty(exports, "ReflectionCategorySerializer", { enumerable: true, get: function () { return serializers_1.ReflectionCategorySerializer; } });
Object.defineProperty(exports, "ReflectionGroupSerializer", { enumerable: true, get: function () { return serializers_1.ReflectionGroupSerializer; } });
Object.defineProperty(exports, "ReflectionSerializer", { enumerable: true, get: function () { return serializers_1.ReflectionSerializer; } });
Object.defineProperty(exports, "ReflectionTypeSerializer", { enumerable: true, get: function () { return serializers_1.ReflectionTypeSerializer; } });
Object.defineProperty(exports, "SignatureReflectionSerializer", { enumerable: true, get: function () { return serializers_1.SignatureReflectionSerializer; } });
Object.defineProperty(exports, "SourceReferenceContainerSerializer", { enumerable: true, get: function () { return serializers_1.SourceReferenceContainerSerializer; } });
Object.defineProperty(exports, "SourceReferenceWrapper", { enumerable: true, get: function () { return serializers_1.SourceReferenceWrapper; } });
Object.defineProperty(exports, "TupleTypeSerializer", { enumerable: true, get: function () { return serializers_1.TupleTypeSerializer; } });
Object.defineProperty(exports, "TypeOperatorTypeSerializer", { enumerable: true, get: function () { return serializers_1.TypeOperatorTypeSerializer; } });
Object.defineProperty(exports, "TypeParameterReflectionSerializer", { enumerable: true, get: function () { return serializers_1.TypeParameterReflectionSerializer; } });
Object.defineProperty(exports, "TypeParameterTypeSerializer", { enumerable: true, get: function () { return serializers_1.TypeParameterTypeSerializer; } });
Object.defineProperty(exports, "TypeSerializer", { enumerable: true, get: function () { return serializers_1.TypeSerializer; } });
Object.defineProperty(exports, "UnknownTypeSerializer", { enumerable: true, get: function () { return serializers_1.UnknownTypeSerializer; } });
const JSONOutput = require("./schema");
exports.JSONOutput = JSONOutput;
