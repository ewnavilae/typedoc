"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackLogger = exports.ConsoleLogger = exports.Logger = exports.LogLevel = void 0;
const ts = require("typescript");
const util_1 = require("util");
const inspector_1 = require("inspector");
const path_1 = require("path");
const isDebugging = () => !!inspector_1.url();
/**
 * List of known log levels. Used to specify the urgency of a log message.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Verbose"] = 0] = "Verbose";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
const Colors = {
    red: "\u001b[91m",
    yellow: "\u001b[93m",
    cyan: "\u001b[96m",
    gray: "\u001b[90m",
    reset: "\u001b[0m",
};
const messagePrefixes = {
    [LogLevel.Error]: `${Colors.red}Error: ${Colors.reset}`,
    [LogLevel.Warn]: `${Colors.yellow}Warning: ${Colors.reset}`,
    [LogLevel.Info]: `${Colors.cyan}Info: ${Colors.reset}`,
    [LogLevel.Verbose]: `${Colors.gray}Debug: ${Colors.reset}`,
};
/**
 * A logger that will not produce any output.
 *
 * This logger also serves as the base class of other loggers as it implements
 * all the required utility functions.
 */
class Logger {
    constructor() {
        /**
         * How many error messages have been logged?
         */
        this.errorCount = 0;
        /**
         * How many warning messages have been logged?
         */
        this.warningCount = 0;
        this.deprecationWarnings = new Set();
        /**
         * The minimum logging level to print.
         */
        this.level = LogLevel.Info;
    }
    /**
     * Has an error been raised through the log method?
     */
    hasErrors() {
        return this.errorCount > 0;
    }
    /**
     * Has a warning been raised through the log method?
     */
    hasWarnings() {
        return this.warningCount > 0;
    }
    /**
     * Reset the error counter.
     */
    resetErrors() {
        this.errorCount = 0;
    }
    /**
     * Reset the warning counter.
     */
    resetWarnings() {
        this.warningCount = 0;
        this.deprecationWarnings.clear();
    }
    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    write(text, ...args) {
        this.deprecated("Logger.write is deprecated, prefer Logger.info");
        this.log(util_1.format(text, ...args), LogLevel.Info);
    }
    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    writeln(text, ...args) {
        this.deprecated("Logger.writeln is deprecated, prefer Logger.info");
        this.log(util_1.format(text, ...args), LogLevel.Info);
    }
    /**
     * @deprecated prefer Logger.info, will be removed in 0.22
     */
    success(text, ...args) {
        this.deprecated("Logger.success is deprecated, prefer Logger.info");
        this.log(util_1.format(text, ...args), LogLevel.Info);
    }
    verbose(text, ...args) {
        if (args.length) {
            this.deprecated("Logger.verbose: Providing formatting arguments is deprecated");
        }
        this.log(util_1.format(text, ...args), LogLevel.Verbose);
    }
    /** Log the given info message. */
    info(text) {
        this.log(text, LogLevel.Info);
    }
    warn(text, ...args) {
        if (args.length) {
            this.deprecated("Logger.warn: Providing formatting arguments is deprecated");
        }
        this.log(util_1.format(text, ...args), LogLevel.Warn);
    }
    error(text, ...args) {
        if (args.length) {
            this.deprecated("Logger.error: Providing formatting arguments is deprecated");
        }
        this.log(util_1.format(text, ...args), LogLevel.Error);
    }
    /** @internal */
    deprecated(text, addStack = true) {
        var _a;
        if (addStack) {
            const stack = (_a = new Error().stack) === null || _a === void 0 ? void 0 : _a.split("\n");
            if (stack && stack.length >= 4) {
                text = text + "\n" + stack[3];
            }
        }
        if (!this.deprecationWarnings.has(text)) {
            this.deprecationWarnings.add(text);
            this.warn(text);
        }
    }
    /**
     * Print a log message.
     *
     * @param _message  The message itself.
     * @param level  The urgency of the log message.
     */
    log(_message, level = LogLevel.Info) {
        if (level === LogLevel.Error) {
            this.errorCount += 1;
        }
        if (level === LogLevel.Warn) {
            this.warningCount += 1;
        }
    }
    /**
     * Print the given TypeScript log messages.
     *
     * @param diagnostics  The TypeScript messages that should be logged.
     */
    diagnostics(diagnostics) {
        diagnostics.forEach((diagnostic) => {
            this.diagnostic(diagnostic);
        });
    }
    /**
     * Print the given TypeScript log message.
     *
     * @param diagnostic  The TypeScript message that should be logged.
     */
    diagnostic(diagnostic) {
        const output = ts.formatDiagnosticsWithColorAndContext([diagnostic], {
            getCanonicalFileName: path_1.resolve,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => ts.sys.newLine,
        });
        switch (diagnostic.category) {
            case ts.DiagnosticCategory.Error:
                this.log(output, LogLevel.Error);
                break;
            case ts.DiagnosticCategory.Warning:
                this.log(output, LogLevel.Warn);
                break;
            case ts.DiagnosticCategory.Message:
                this.log(output, LogLevel.Info);
        }
    }
}
exports.Logger = Logger;
/**
 * A logger that outputs all messages to the console.
 */
class ConsoleLogger extends Logger {
    /**
     * Print a log message.
     *
     * @param message  The message itself.
     * @param level  The urgency of the log message.
     */
    log(message, level = LogLevel.Info) {
        super.log(message, level);
        if (level < this.level && !isDebugging()) {
            return;
        }
        const method = {
            [LogLevel.Error]: "error",
            [LogLevel.Warn]: "warn",
            [LogLevel.Info]: "info",
            [LogLevel.Verbose]: "log",
        }[level];
        console[method](messagePrefixes[level] + message);
    }
}
exports.ConsoleLogger = ConsoleLogger;
/**
 * A logger that calls a callback function.
 */
class CallbackLogger extends Logger {
    /**
     * Create a new CallbackLogger instance.
     *
     * @param callback  The callback that should be used to log messages.
     */
    constructor(callback) {
        super();
        this.callback = callback;
    }
    /**
     * Print a log message.
     *
     * @param message  The message itself.
     * @param level  The urgency of the log message.
     */
    log(message, level = LogLevel.Info) {
        super.log(message, level);
        this.callback(message, level);
    }
}
exports.CallbackLogger = CallbackLogger;
