type RunAt = chrome.extensionTypes.RunAt;
type StyleOrigin = chrome.scripting.StyleOrigin;

export interface InjectCssOptions {
    tabId: number;
    frameId?: boolean | number | number[];
    matchAboutBlank?: boolean;
    origin?: StyleOrigin;

    // Options for MV2
    runAt?: RunAt;

    // Options for MV3
    documentId?: string | string[];
}

export interface InjectCssContract {
    insert: (css: string) => Promise<void>;

    file: (files: string | string[]) => Promise<void>;

    options: (options: Partial<InjectCssOptions>) => this;
}
