import {InjectCssContract, InjectCssCommonOptions} from "./types";

export default abstract class implements InjectCssContract {
    protected constructor(protected options: InjectCssCommonOptions) {
    }

    public setOptions(options: Partial<InjectCssCommonOptions>): this {
        this.options = {...this.options, ...options, tabId: options.tabId ?? this.options.tabId};

        return this;
    }

    public abstract run(css: string): Promise<void>

    public abstract file(files: string | string[]): Promise<void>

    protected get frameIds(): number[] | undefined {
        const {frameId} = this.options;

        return typeof frameId === 'number' ? [frameId] : typeof frameId !== 'boolean' ? frameId : undefined;
    }

    protected get allFrames(): boolean | undefined {
        const {frameId} = this.options;

        return typeof frameId === 'boolean' ? frameId : undefined;
    }

    protected get matchAboutBlank(): boolean {
        const {matchAboutBlank} = this.options;

        return typeof matchAboutBlank === "boolean" ? matchAboutBlank : true;
    }
}
