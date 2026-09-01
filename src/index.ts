import {isManifestVersion3} from "@addon-core/browser";
import InjectCssV2 from "./InjectCssV2";
import InjectCssV3 from "./InjectCssV3";
import type {InjectCssContract, InjectCssOptions} from "./types";

export {
    InjectCssBaseError,
    InjectCssDeliveryError,
    InjectCssFrameDeliveryError,
    InjectCssTimeoutError,
    InvalidInjectCssCodeError,
    InvalidInjectCssFilesError,
    InvalidInjectCssOptionsError,
    InvalidInjectCssTargetError,
    UnsupportedInjectCssOptionError,
    UnsupportedInjectCssTargetError,
} from "./errors";
export type {InjectCssErrorCode} from "./errors";
export type {
    InjectCssAllFramesTarget,
    InjectCssContract,
    InjectCssDocumentsTarget,
    InjectCssExecutionOptions,
    InjectCssFramesTarget,
    InjectCssOptions,
    InjectCssOrigin,
    InjectCssTarget,
    InjectCssTopFrameTarget,
    NonEmptyReadonlyArray,
} from "./types";

export const injectCss = (options: InjectCssOptions): InjectCssContract => {
    return isManifestVersion3() ? new InjectCssV3(options) : new InjectCssV2(options);
};

export default injectCss;
