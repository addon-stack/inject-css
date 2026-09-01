import injectCss, {
    type InjectCssErrorCode,
    type InjectCssExecutionOptions,
    type InjectCssExecutionOptionsPatch,
    type InjectCssOperation,
    type InjectCssOrigin,
    type InjectCssTarget,
    type NonEmptyReadonlyArray,
    injectCss as namedInjectCss,
} from "../src/index";

declare const tabId: number;
declare const frameId: number;
declare const documentId: string;

const topFrame = injectCss({target: {tabId}});

namedInjectCss({target: {tabId}});

injectCss({target: {tabId, allFrames: true}});
injectCss({target: {tabId, frameIds: [0, frameId]}});
injectCss({target: {tabId, documentIds: [documentId]}});

// @ts-expect-error selectors are mutually exclusive
injectCss({target: {tabId, allFrames: true, frameIds: [frameId]}});

// @ts-expect-error selectors are mutually exclusive
injectCss({target: {tabId, frameIds: [frameId], documentIds: [documentId]}});

// @ts-expect-error explicit frame targets must not be empty
injectCss({target: {tabId, frameIds: []}});

// @ts-expect-error explicit document targets must not be empty
injectCss({target: {tabId, documentIds: []}});

// @ts-expect-error allFrames only accepts literal true
injectCss({target: {tabId, allFrames: false}});

const authorOrigin: InjectCssOrigin = "AUTHOR";
const userOrigin: InjectCssOrigin = "USER";

injectCss({target: {tabId}, origin: authorOrigin});
injectCss({target: {tabId}, origin: userOrigin});
injectCss({target: {tabId}, runAt: "document_start", matchAboutBlank: false, timeoutMs: 50});

// @ts-expect-error origins use the canonical WebExtension casing
injectCss({target: {tabId}, origin: "author"});

const inserted: Promise<void> = topFrame.insert("body { color: red; }");
const singleFile: Promise<void> = topFrame.file("/content.css");
const files: NonEmptyReadonlyArray<string> = ["/first.css", "/second.css"];
const multipleFiles: Promise<void> = topFrame.file(files);
const removed: Promise<void> = topFrame.remove("body { color: red; }");
const removedFile: Promise<void> = topFrame.removeFile("/content.css");
const removedFiles: Promise<void> = topFrame.removeFile(files);

topFrame.file(["/content.css"]);

// @ts-expect-error at least one file is required
topFrame.file([]);

// @ts-expect-error every file must be a string
topFrame.file([1]);

// @ts-expect-error at least one file is required
topFrame.removeFile([]);

// @ts-expect-error every file must be a string
topFrame.removeFile([1]);

// @ts-expect-error CSS code must be a string
topFrame.insert(42);

// @ts-expect-error CSS code must be a string
topFrame.remove(42);

topFrame.target({tabId, frameIds: [frameId]}).options({origin: "USER", timeoutMs: 100});
topFrame.options({matchAboutBlank: undefined, runAt: undefined, origin: undefined, timeoutMs: undefined});

// @ts-expect-error target changes belong to target(), not options()
topFrame.options({target: {tabId: 99}});

// @ts-expect-error legacy flat target fields are not execution options
topFrame.options({tabId: 99});

const executionOptions: InjectCssExecutionOptions = {
    matchAboutBlank: true,
    origin: "AUTHOR",
    runAt: "document_idle",
    timeoutMs: 1_000,
};
const executionOptionsPatch: InjectCssExecutionOptionsPatch = {
    origin: undefined,
    timeoutMs: 2_000,
};
const target: InjectCssTarget = {tabId, documentIds: [documentId]};
const errorCode: InjectCssErrorCode = "ERR_INJECT_CSS_DELIVERY";
const frameDeliveryCode: InjectCssErrorCode = "ERR_INJECT_CSS_FRAME_DELIVERY";
const unsupportedOperationCode: InjectCssErrorCode = "ERR_INJECT_CSS_UNSUPPORTED_OPERATION";
const operation: InjectCssOperation = "remove";

topFrame.options(executionOptions);
topFrame.options(executionOptionsPatch);
topFrame.target(target);
errorCode.toUpperCase();
frameDeliveryCode.toUpperCase();
unsupportedOperationCode.toUpperCase();
operation.toUpperCase();

void inserted;
void singleFile;
void multipleFiles;
void removed;
void removedFile;
void removedFiles;
