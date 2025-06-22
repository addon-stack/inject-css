import {isManifestVersion3} from "@adnbn/browser";

import InjectCssV2 from "./InjectCssV2";
import InjectCssV3 from "./InjectCssV3";

import {InjectCssCommonOptions, InjectCssContract, InjectCssOptions} from "./types";

export {
    type InjectCssContract,
    type InjectCssCommonOptions,
    type InjectCssOptions
};

export const injectCssFactory = (options: InjectCssOptions): InjectCssContract => {
    const {runAt, ...optionsV3} = options;
    const {documentId, ...optionsV2} = options;

    return isManifestVersion3()
        ? new InjectCssV3(optionsV3)
        : new InjectCssV2(optionsV2);
}
