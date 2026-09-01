type RunAt = chrome.extensionTypes.RunAt;
type StyleOrigin = chrome.scripting.StyleOrigin;

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export type InjectCssOrigin = StyleOrigin | `${StyleOrigin}`;

export interface InjectCssTopFrameTarget {
    tabId: number;
    allFrames?: never;
    frameIds?: never;
    documentIds?: never;
}

export interface InjectCssAllFramesTarget {
    tabId: number;
    allFrames: true;
    frameIds?: never;
    documentIds?: never;
}

export interface InjectCssFramesTarget {
    tabId: number;
    frameIds: NonEmptyReadonlyArray<number>;
    allFrames?: never;
    documentIds?: never;
}

export interface InjectCssDocumentsTarget {
    tabId: number;
    documentIds: NonEmptyReadonlyArray<string>;
    allFrames?: never;
    frameIds?: never;
}

export type InjectCssTarget =
    | InjectCssTopFrameTarget
    | InjectCssAllFramesTarget
    | InjectCssFramesTarget
    | InjectCssDocumentsTarget;

export interface InjectCssExecutionOptions {
    matchAboutBlank?: boolean;
    runAt?: RunAt;
    origin?: InjectCssOrigin;
    timeoutMs?: number;
}

export type InjectCssExecutionOptionsPatch = {
    [Key in keyof InjectCssExecutionOptions]?: InjectCssExecutionOptions[Key] | undefined;
};

export interface InjectCssOptions extends InjectCssExecutionOptions {
    target: InjectCssTarget;
}

export interface InjectCssContract {
    insert(css: string): Promise<void>;

    file(files: string | NonEmptyReadonlyArray<string>): Promise<void>;

    target(target: InjectCssTarget): this;

    options(options: InjectCssExecutionOptionsPatch): this;
}
