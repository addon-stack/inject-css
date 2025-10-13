import {insertCssTab} from "@addon-core/browser";

import AbstractInjectCss from "./AbstractInjectCss";

import {InjectCssOptions} from "./types";

type CSSOrigin = chrome.extensionTypes.CSSOrigin;
type InjectDetails = chrome.extensionTypes.InjectDetails;

export default class extends AbstractInjectCss {
    public constructor(options: InjectCssOptions) {
        super(options);
    }

    public async insert(code: string): Promise<void> {
        const {tabId, runAt} = this._options;

        const details: InjectDetails = {
            code,
            runAt,
            cssOrigin: this.cssOrigin,
            matchAboutBlank: this.matchAboutBlank,
        };

        if (this.allFrames) {
            await insertCssTab(tabId, {...details, allFrames: true});
        } else if (this.frameIds) {
            await Promise.all(this.frameIds.map(frameId => insertCssTab(tabId, {...details, frameId})));
        } else {
            await insertCssTab(tabId, details);
        }
    }

    public async file(files: string | string[]): Promise<void> {
        const {tabId, runAt} = this._options;

        const fileList = typeof files === "string" ? [files] : files;

        const injectTasks: Promise<any>[] = [];

        for (const file of fileList) {
            const details: InjectDetails = {
                file,
                runAt,
                cssOrigin: this.cssOrigin,
                matchAboutBlank: this.matchAboutBlank,
            };

            if (this.allFrames) {
                injectTasks.push(insertCssTab(tabId, {...details, allFrames: true}));
            } else if (this.frameIds) {
                injectTasks.push(...this.frameIds.map(frameId => insertCssTab(tabId, {...details, frameId})));
            } else {
                injectTasks.push(insertCssTab(tabId, details));
            }
        }

        await Promise.all(injectTasks);
    }

    protected get cssOrigin(): CSSOrigin | undefined {
        const {origin} = this._options;

        return origin && (origin.toLowerCase() as CSSOrigin);
    }
}
