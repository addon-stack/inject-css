const UNSUPPORTED_API_PATTERN = /(not supported|unsupported|not (?:available|implemented)|is not a function)\b/i;
const UNSUPPORTED_FIELD_PATTERN =
    /(not supported|unsupported|unexpected|unknown|unrecognized|invalid|not (?:a )?valid)\b/i;
const UNSUPPORTED_TARGET_FIELD_PATTERN = /(not supported|unsupported|unexpected|unknown|unrecognized)\b/i;

export const getNativeErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : String(error);
};

export const isUnsupportedRemovalCapabilityError = (error: unknown): boolean => {
    const message = getNativeErrorMessage(error);

    return /remove\s*css/i.test(message) && UNSUPPORTED_API_PATTERN.test(message);
};

export const isUnsupportedOriginCapabilityError = (error: unknown): boolean => {
    const message = getNativeErrorMessage(error);

    // MV2 usually names the field "cssOrigin", while MV3 uses "origin" and some browsers describe it as a
    // "style origin". Treat those spellings as the same package capability.
    return /\b(?:(?:css|style)[\s_-]*)?origin\b/i.test(message) && UNSUPPORTED_FIELD_PATTERN.test(message);
};

export const isUnsupportedDocumentTargetCapabilityError = (error: unknown): boolean => {
    const message = getNativeErrorMessage(error);

    // Keep this intentionally narrower than option detection: "Invalid documentId" can mean a stale target.
    return /documentIds?/i.test(message) && UNSUPPORTED_TARGET_FIELD_PATTERN.test(message);
};
