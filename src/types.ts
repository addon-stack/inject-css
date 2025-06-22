type RunAt = chrome.extensionTypes.RunAt;
type StyleOrigin = chrome.scripting.StyleOrigin

export interface InjectCssContract {
    run: (css: string) => Promise<void>;

    file: (files: string | string[]) => Promise<void>;

    options: (options: Partial<InjectCssCommonOptions>) => this;
}

export interface InjectCssCommonOptions {
    tabId: number,
    frameId?: boolean | number | number[],
    matchAboutBlank?: boolean,
    origin?: StyleOrigin,
}

export interface InjectCssV2Options extends InjectCssCommonOptions {
    runAt?: RunAt;
}

export interface InjectCssV3Options extends InjectCssCommonOptions {
    documentId?: string | string[];
}

export type InjectCssOptions = InjectCssV2Options & InjectCssV3Options
