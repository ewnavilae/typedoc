import { TemplateDelegate } from "handlebars";
import { Event } from "../utils/events";
import { ProjectReflection } from "../models/reflections/project";
import { UrlMapping } from "./models/UrlMapping";
import { NavigationItem } from "./models/NavigationItem";
import { LegendItem } from "./plugins/LegendPlugin";
/**
 * An event emitted by the [[Renderer]] class at the very beginning and
 * ending of the entire rendering process.
 *
 * @see [[Renderer.EVENT_BEGIN]]
 * @see [[Renderer.EVENT_END]]
 */
export declare class RendererEvent extends Event {
    /**
     * The project the renderer is currently processing.
     */
    readonly project: ProjectReflection;
    /**
     * The settings that have been passed to TypeDoc.
     */
    settings: any;
    /**
     * The path of the directory the documentation should be written to.
     */
    readonly outputDirectory: string;
    /**
     * A list of all pages that should be generated.
     *
     * This list can be altered during the [[Renderer.EVENT_BEGIN]] event.
     */
    urls?: UrlMapping[];
    /**
     * Triggered before the renderer starts rendering a project.
     * @event
     */
    static BEGIN: string;
    /**
     * Triggered after the renderer has written all documents.
     * @event
     */
    static END: string;
    constructor(name: string, outputDirectory: string, project: ProjectReflection);
    /**
     * Create an [[PageEvent]] event based on this event and the given url mapping.
     *
     * @internal
     * @param mapping  The mapping that defines the generated [[PageEvent]] state.
     * @returns A newly created [[PageEvent]] instance.
     */
    createPageEvent(mapping: UrlMapping): PageEvent;
}
/**
 * An event emitted by the [[Renderer]] class before and after the
 * markup of a page is rendered.
 *
 * This object will be passed as the rendering context to handlebars templates.
 *
 * @see [[Renderer.EVENT_BEGIN_PAGE]]
 * @see [[Renderer.EVENT_END_PAGE]]
 */
export declare class PageEvent extends Event {
    /**
     * The project the renderer is currently processing.
     */
    project: ProjectReflection;
    /**
     * The settings that have been passed to TypeDoc.
     */
    settings: any;
    /**
     * The filename the page will be written to.
     */
    filename: string;
    /**
     * The url this page will be located at.
     */
    url: string;
    /**
     * The model that should be rendered on this page.
     */
    model: any;
    /**
     * The template that should be used to render this page.
     */
    template?: TemplateDelegate;
    /**
     * The name of the template that should be used to render this page.
     */
    templateName: string;
    /**
     * The primary navigation structure of this page.
     */
    navigation?: NavigationItem;
    /**
     * The table of contents structure of this page.
     */
    toc?: NavigationItem;
    /**
     * The legend items that are applicable for this page
     */
    legend?: LegendItem[][];
    /**
     * The final html content of this page.
     *
     * Should be rendered by layout templates and can be modifies by plugins.
     */
    contents?: string;
    /**
     * Triggered before a document will be rendered.
     * @event
     */
    static BEGIN: string;
    /**
     * Triggered after a document has been rendered, just before it is written to disc.
     * @event
     */
    static END: string;
}
/**
 * An event emitted by the [[MarkedPlugin]] on the [[Renderer]] after a chunk of
 * markdown has been processed. Allows other plugins to manipulate the result.
 *
 * @see [[MarkedPlugin.EVENT_PARSE_MARKDOWN]]
 */
export declare class MarkdownEvent extends Event {
    /**
     * The unparsed original text.
     */
    readonly originalText: string;
    /**
     * The parsed output.
     */
    parsedText: string;
    /**
     * Triggered on the renderer when this plugin parses a markdown string.
     * @event
     */
    static PARSE: string;
    constructor(name: string, originalText: string, parsedText: string);
}
