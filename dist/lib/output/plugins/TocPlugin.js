"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TocPlugin_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TocPlugin = void 0;
const index_1 = require("../../models/reflections/index");
const components_1 = require("../components");
const events_1 = require("../events");
const NavigationItem_1 = require("../models/NavigationItem");
/**
 * A plugin that generates a table of contents for the current page.
 *
 * The table of contents will start at the nearest module or dynamic module. This plugin
 * sets the [[PageEvent.toc]] property.
 */
let TocPlugin = TocPlugin_1 = class TocPlugin extends components_1.RendererComponent {
    /**
     * Create a new TocPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [events_1.PageEvent.BEGIN]: this.onRendererBeginPage,
        });
    }
    /**
     * Triggered before a document will be rendered.
     *
     * @param page  An event object describing the current render operation.
     */
    onRendererBeginPage(page) {
        let model = page.model;
        if (!(model instanceof index_1.Reflection)) {
            return;
        }
        const trail = [];
        while (!(model instanceof index_1.ProjectReflection) &&
            !model.kindOf(index_1.ReflectionKind.SomeModule)) {
            trail.unshift(model);
            model = model.parent;
        }
        const tocRestriction = this.owner.toc;
        page.toc = new NavigationItem_1.NavigationItem();
        TocPlugin_1.buildToc(model, trail, page.toc, tocRestriction);
    }
    /**
     * Create a toc navigation item structure.
     *
     * @param model   The models whose children should be written to the toc.
     * @param trail   Defines the active trail of expanded toc entries.
     * @param parent  The parent [[NavigationItem]] the toc should be appended to.
     * @param restriction  The restricted table of contents.
     */
    static buildToc(model, trail, parent, restriction) {
        const index = trail.indexOf(model);
        const children = (model instanceof index_1.ContainerReflection && model.children) || [];
        if (index < trail.length - 1 && children.length > 40) {
            const child = trail[index + 1];
            const item = NavigationItem_1.NavigationItem.create(child, parent, true);
            item.isInPath = true;
            item.isCurrent = false;
            TocPlugin_1.buildToc(child, trail, item);
        }
        else {
            children.forEach((child) => {
                if (restriction &&
                    restriction.length > 0 &&
                    !restriction.includes(child.name)) {
                    return;
                }
                if (child.kindOf(index_1.ReflectionKind.SomeModule)) {
                    return;
                }
                const item = NavigationItem_1.NavigationItem.create(child, parent, true);
                if (trail.includes(child)) {
                    item.isInPath = true;
                    item.isCurrent = trail[trail.length - 1] === child;
                    TocPlugin_1.buildToc(child, trail, item);
                }
            });
        }
    }
};
TocPlugin = TocPlugin_1 = __decorate([
    components_1.Component({ name: "toc" })
], TocPlugin);
exports.TocPlugin = TocPlugin;
