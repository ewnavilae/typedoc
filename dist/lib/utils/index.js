"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortReflections = exports.loadPlugins = exports.discoverNpmPlugins = exports.TypeDocReader = exports.TSConfigReader = exports.ParameterType = exports.ParameterHint = exports.Options = exports.BindOption = exports.ArgumentsReader = exports.LogLevel = exports.Logger = exports.ConsoleLogger = exports.CallbackLogger = exports.writeFileSync = exports.writeFile = exports.remove = exports.readFile = exports.normalizePath = exports.getCommonDirectory = exports.copySync = exports.copy = exports.EventDispatcher = exports.Event = exports.Component = exports.ChildableComponent = exports.AbstractComponent = exports.uniqueByEquals = exports.unique = exports.removeIfPresent = exports.removeIf = exports.partition = exports.insertPrioritySorted = exports.filterMap = void 0;
var array_1 = require("./array");
Object.defineProperty(exports, "filterMap", { enumerable: true, get: function () { return array_1.filterMap; } });
Object.defineProperty(exports, "insertPrioritySorted", { enumerable: true, get: function () { return array_1.insertPrioritySorted; } });
Object.defineProperty(exports, "partition", { enumerable: true, get: function () { return array_1.partition; } });
Object.defineProperty(exports, "removeIf", { enumerable: true, get: function () { return array_1.removeIf; } });
Object.defineProperty(exports, "removeIfPresent", { enumerable: true, get: function () { return array_1.removeIfPresent; } });
Object.defineProperty(exports, "unique", { enumerable: true, get: function () { return array_1.unique; } });
Object.defineProperty(exports, "uniqueByEquals", { enumerable: true, get: function () { return array_1.uniqueByEquals; } });
var component_1 = require("./component");
Object.defineProperty(exports, "AbstractComponent", { enumerable: true, get: function () { return component_1.AbstractComponent; } });
Object.defineProperty(exports, "ChildableComponent", { enumerable: true, get: function () { return component_1.ChildableComponent; } });
Object.defineProperty(exports, "Component", { enumerable: true, get: function () { return component_1.Component; } });
var events_1 = require("./events");
Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return events_1.Event; } });
Object.defineProperty(exports, "EventDispatcher", { enumerable: true, get: function () { return events_1.EventDispatcher; } });
var fs_1 = require("./fs");
Object.defineProperty(exports, "copy", { enumerable: true, get: function () { return fs_1.copy; } });
Object.defineProperty(exports, "copySync", { enumerable: true, get: function () { return fs_1.copySync; } });
Object.defineProperty(exports, "getCommonDirectory", { enumerable: true, get: function () { return fs_1.getCommonDirectory; } });
Object.defineProperty(exports, "normalizePath", { enumerable: true, get: function () { return fs_1.normalizePath; } });
Object.defineProperty(exports, "readFile", { enumerable: true, get: function () { return fs_1.readFile; } });
Object.defineProperty(exports, "remove", { enumerable: true, get: function () { return fs_1.remove; } });
Object.defineProperty(exports, "writeFile", { enumerable: true, get: function () { return fs_1.writeFile; } });
Object.defineProperty(exports, "writeFileSync", { enumerable: true, get: function () { return fs_1.writeFileSync; } });
var loggers_1 = require("./loggers");
Object.defineProperty(exports, "CallbackLogger", { enumerable: true, get: function () { return loggers_1.CallbackLogger; } });
Object.defineProperty(exports, "ConsoleLogger", { enumerable: true, get: function () { return loggers_1.ConsoleLogger; } });
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return loggers_1.Logger; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return loggers_1.LogLevel; } });
var options_1 = require("./options");
Object.defineProperty(exports, "ArgumentsReader", { enumerable: true, get: function () { return options_1.ArgumentsReader; } });
Object.defineProperty(exports, "BindOption", { enumerable: true, get: function () { return options_1.BindOption; } });
Object.defineProperty(exports, "Options", { enumerable: true, get: function () { return options_1.Options; } });
Object.defineProperty(exports, "ParameterHint", { enumerable: true, get: function () { return options_1.ParameterHint; } });
Object.defineProperty(exports, "ParameterType", { enumerable: true, get: function () { return options_1.ParameterType; } });
Object.defineProperty(exports, "TSConfigReader", { enumerable: true, get: function () { return options_1.TSConfigReader; } });
Object.defineProperty(exports, "TypeDocReader", { enumerable: true, get: function () { return options_1.TypeDocReader; } });
var plugins_1 = require("./plugins");
Object.defineProperty(exports, "discoverNpmPlugins", { enumerable: true, get: function () { return plugins_1.discoverNpmPlugins; } });
Object.defineProperty(exports, "loadPlugins", { enumerable: true, get: function () { return plugins_1.loadPlugins; } });
var sort_1 = require("./sort");
Object.defineProperty(exports, "sortReflections", { enumerable: true, get: function () { return sort_1.sortReflections; } });
