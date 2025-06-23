type StyleOrigin = chrome.scripting.StyleOrigin;

export interface InjectCssOptions {
    tabId: number;
    frameId?: boolean | number | number[];
    matchAboutBlank?: boolean;
    origin?: StyleOrigin;
}

export interface InjectCssContract {
    insert: (css: string) => Promise<void>;

    file: (files: string | string[]) => Promise<void>;

    options: (options: Partial<InjectCssOptions>) => this;
}
