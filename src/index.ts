import {isManifestVersion3} from "@adnbn/browser";

import InjectCssV2, {InjectCssV2Options} from "./InjectCssV2";
import InjectCssV3, {InjectCssV3Options} from "./InjectCssV3";

import {InjectCssContract, InjectCssOptions} from "./types";

export type InjectCssUnionOptions = InjectCssV2Options & InjectCssV3Options;

export {type InjectCssContract, type InjectCssOptions};

export default (options: InjectCssUnionOptions): InjectCssContract => {
    const {runAt, ...optionsV3} = options;
    const {documentId, ...optionsV2} = options;

    return isManifestVersion3() ? new InjectCssV3(optionsV3) : new InjectCssV2(optionsV2);
};
