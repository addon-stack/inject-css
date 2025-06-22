import {insertCss} from "@adnbn/browser";

import AbstractInjectCss from "./AbstractInjectCss";

import {InjectCssV3Options} from "./types";

type InjectionTarget = chrome.scripting.InjectionTarget

export default class extends AbstractInjectCss {
    constructor(protected options: InjectCssV3Options) {
        super(options);
    }

    public async run(css: string): Promise<void> {
        const {origin} = this.options;

        return insertCss({target: this.target, css, origin});
    }

    public async file(fileList: string | string[]): Promise<void> {
        const {origin} = this.options;
        const files = typeof fileList === 'string' ? [fileList] : fileList;

        await insertCss({target: this.target, files, origin});
    }

    protected get target(): InjectionTarget {
        const {tabId} = this.options;

        return {
            tabId,
            allFrames: this.allFrames,
            frameIds: this.frameIds,
            documentIds: this.documentIds,
        };
    }

    protected get documentIds(): string[] | undefined {
        const {documentId} = this.options;

        return typeof documentId === 'string' ? [documentId] : documentId;
    }
}
