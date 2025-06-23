import {insertCss} from "@adnbn/browser";

import AbstractInjectCss from "./AbstractInjectCss";

import {InjectCssOptions} from "./types";

type InjectionTarget = chrome.scripting.InjectionTarget;

export interface InjectCssV3Options extends InjectCssOptions {
    documentId?: string | string[];
}

export default class extends AbstractInjectCss {
    constructor(protected _options: InjectCssV3Options) {
        super(_options);
    }

    public async insert(css: string): Promise<void> {
        const {origin} = this._options;

        return insertCss({target: this.target, css, origin});
    }

    public async file(fileList: string | string[]): Promise<void> {
        const {origin} = this._options;
        const files = typeof fileList === "string" ? [fileList] : fileList;

        await insertCss({target: this.target, files, origin});
    }

    protected get target(): InjectionTarget {
        const {tabId} = this._options;

        return {
            tabId,
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
