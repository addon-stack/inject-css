import {isManifestVersion3} from "@adnbn/browser";

import InjectCssV2 from "./InjectCssV2";
import InjectCssV3 from "./InjectCssV3";

import {InjectCssContract, InjectCssOptions} from "./types";

export {type InjectCssContract, type InjectCssOptions};

export default (options: InjectCssOptions): InjectCssContract => {
    return isManifestVersion3() ? new InjectCssV3(options) : new InjectCssV2(options);
};
