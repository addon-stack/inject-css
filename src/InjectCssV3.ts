import {insertCss} from "@addon-core/browser";
import AbstractInjectCss from "./AbstractInjectCss";

type InjectionTarget = chrome.scripting.InjectionTarget;

export default class extends AbstractInjectCss {
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
        const target = {tabId: this._options.tabId};

        if (this.frameIds && this.frameIds.length > 0) {
            return {...target, frameIds: this.frameIds};
        }

        if (this.allFrames === true) {
            return {...target, allFrames: true};
        }

        // Firefox does not support `documentIds` in the target
        // getBrowserInfo is only available in firefox
        // @ts-expect-error
        const isFirefox = !!browser().runtime.getBrowserInfo;

        if (!isFirefox) {
            const documentIds = this.documentIds;

            if (documentIds && documentIds.length > 0) {
                return {...target, documentIds};
            }
        }

        return target;
    }

    protected get documentIds(): string[] | undefined {
        const {documentId} = this._options;

        return typeof documentId === "string" ? [documentId] : documentId;
    }
}
