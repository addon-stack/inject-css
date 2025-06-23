import {InjectCssContract, InjectCssOptions} from "./types";

export default abstract class implements InjectCssContract {
    protected constructor(protected _options: InjectCssOptions) {}

    public options(options: Partial<InjectCssOptions>): this {
        this._options = {...this._options, ...options, tabId: options.tabId ?? this._options.tabId};

        return this;
    }

    public abstract insert(css: string): Promise<void>;

    public abstract file(files: string | string[]): Promise<void>;

    protected get frameIds(): number[] | undefined {
        const {frameId} = this._options;

        return typeof frameId === "number" ? [frameId] : typeof frameId !== "boolean" ? frameId : undefined;
    }

    protected get allFrames(): boolean | undefined {
        const {frameId} = this._options;

        return typeof frameId === "boolean" ? frameId : undefined;
    }

    protected get matchAboutBlank(): boolean {
        const {matchAboutBlank} = this._options;

        return typeof matchAboutBlank === "boolean" ? matchAboutBlank : true;
    }
}
