"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const utils_1 = require("../../../lib/utils");
const help_1 = require("../../../lib/utils/options/help");
describe("Options - help", () => {
    const options = new utils_1.Options(new utils_1.Logger());
    options.addDeclarations([
        { name: "td-option", help: "help", type: utils_1.ParameterType.String },
        { name: "td-option2", help: "help" },
        { name: "not displayed", help: "" },
        {
            name: "td",
            help: "help",
            hint: utils_1.ParameterHint.File,
        },
    ]);
    it("Describes TypeDoc options", () => {
        const help = help_1.getOptionsHelp(options);
        assert_1.ok(help.includes("td-option"));
    });
    it("Does not list options without help", () => {
        const help = help_1.getOptionsHelp(options);
        assert_1.ok(!help.includes("not displayed"));
    });
});
