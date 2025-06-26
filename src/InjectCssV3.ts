import {insertCss} from "@adnbn/browser";

import AbstractInjectCss from "./AbstractInjectCss";

import {InjectCssOptions} from "./types";

type InjectionTarget = chrome.scripting.InjectionTarget;

export default class extends AbstractInjectCss {
    constructor(options: InjectCssOptions) {
        super(options);
    }

    public async insert(css: string): Promise<void> {
        await insertCss({
            target: this.target,
            origin: this._options.origin,
            css,
        });
    }

    public async file(fileList: string | string[]): Promise<void> {
        await insertCss({
            target: this.target,
            origin: this._options.origin,
            files: typeof fileList === "string" ? [fileList] : fileList,
        });
    }

    protected get target(): InjectionTarget {
        return {
            tabId: this._options.tabId,
            allFrames: this.allFrames,
            frameIds: this.frameIds,
            documentIds: this.documentIds,
        };
    }

    protected get documentIds(): string[] | undefined {
        const {documentId} = this._options;

        return typeof documentId === "string" ? [documentId] : documentId;
    }
}
