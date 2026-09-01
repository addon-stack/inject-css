import {
    InvalidInjectCssCodeError,
    InvalidInjectCssFilesError,
    InvalidInjectCssOptionsError,
    InvalidInjectCssTargetError,
} from "./errors";
import type {InjectCssExecutionOptions, InjectCssTarget, NonEmptyReadonlyArray} from "./types";

const TARGET_KEYS = new Set(["tabId", "allFrames", "frameIds", "documentIds"]);
const EXECUTION_OPTION_KEYS = new Set(["matchAboutBlank", "runAt", "origin", "timeoutMs"]);
const INJECT_CSS_OPTION_KEYS = new Set(["target", ...EXECUTION_OPTION_KEYS]);
const RUN_AT_VALUES = new Set(["document_start", "document_end", "document_idle"]);
const ORIGIN_VALUES = new Set(["AUTHOR", "USER"]);

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const assertKnownKeys = (value: Record<string, unknown>, keys: Set<string>, subject: string): void => {
    const unknownKeys = Object.keys(value).filter(key => !keys.has(key));

    if (unknownKeys.length > 0) {
        throw new InvalidInjectCssOptionsError(
            `${subject} contains unknown ${unknownKeys.length === 1 ? "field" : "fields"}: ${unknownKeys
                .map(key => `"${key}"`)
                .join(", ")}.`
        );
    }
};

const cloneTarget = (target: InjectCssTarget): InjectCssTarget => {
    if ("frameIds" in target && target.frameIds !== undefined) {
        return {tabId: target.tabId, frameIds: [...target.frameIds] as NonEmptyReadonlyArray<number>};
    }

    if ("documentIds" in target && target.documentIds !== undefined) {
        return {tabId: target.tabId, documentIds: [...target.documentIds] as NonEmptyReadonlyArray<string>};
    }

    if ("allFrames" in target && target.allFrames === true) {
        return {tabId: target.tabId, allFrames: true};
    }

    return {tabId: target.tabId};
};

export const validateInjectCssTarget = (value: unknown): InjectCssTarget => {
    if (!isObject(value)) {
        throw new InvalidInjectCssTargetError("target must be an object.");
    }

    const unknownKeys = Object.keys(value).filter(key => !TARGET_KEYS.has(key));

    if (unknownKeys.length > 0) {
        throw new InvalidInjectCssTargetError(
            `target contains unknown ${unknownKeys.length === 1 ? "field" : "fields"}: ${unknownKeys
                .map(key => `"${key}"`)
                .join(", ")}.`
        );
    }

    if (!Number.isInteger(value.tabId) || (value.tabId as number) < 0) {
        throw new InvalidInjectCssTargetError('"tabId" must be a non-negative integer.');
    }

    const selectors = ["allFrames", "frameIds", "documentIds"].filter(key => value[key] !== undefined);

    if (selectors.length > 1) {
        throw new InvalidInjectCssTargetError('"allFrames", "frameIds", and "documentIds" are mutually exclusive.');
    }

    if (value.allFrames !== undefined && value.allFrames !== true) {
        throw new InvalidInjectCssTargetError('"allFrames" must be exactly true when provided.');
    }

    if (value.frameIds !== undefined) {
        if (!Array.isArray(value.frameIds) || value.frameIds.length === 0) {
            throw new InvalidInjectCssTargetError('"frameIds" must contain at least one frame ID.');
        }

        if (value.frameIds.some(frameId => !Number.isInteger(frameId) || frameId < 0)) {
            throw new InvalidInjectCssTargetError("frame ID must be a non-negative integer.");
        }

        if (new Set(value.frameIds).size !== value.frameIds.length) {
            throw new InvalidInjectCssTargetError('"frameIds" must not contain duplicate frame IDs.');
        }
    }

    if (value.documentIds !== undefined) {
        if (!Array.isArray(value.documentIds) || value.documentIds.length === 0) {
            throw new InvalidInjectCssTargetError('"documentIds" must contain at least one document ID.');
        }

        if (value.documentIds.some(documentId => typeof documentId !== "string" || documentId.trim().length === 0)) {
            throw new InvalidInjectCssTargetError("document ID must be a non-empty string.");
        }

        if (new Set(value.documentIds).size !== value.documentIds.length) {
            throw new InvalidInjectCssTargetError('"documentIds" must not contain duplicate document IDs.');
        }
    }

    return cloneTarget(value as unknown as InjectCssTarget);
};

export const validateInjectCssExecutionOptions = (value: unknown): InjectCssExecutionOptions => {
    if (!isObject(value)) {
        throw new InvalidInjectCssOptionsError("execution options must be an object.");
    }

    assertKnownKeys(value, EXECUTION_OPTION_KEYS, "execution options");

    if (value.matchAboutBlank !== undefined && typeof value.matchAboutBlank !== "boolean") {
        throw new InvalidInjectCssOptionsError('"matchAboutBlank" must be a boolean.');
    }

    if (value.runAt !== undefined && (typeof value.runAt !== "string" || !RUN_AT_VALUES.has(value.runAt))) {
        throw new InvalidInjectCssOptionsError('"runAt" must be "document_start", "document_end", or "document_idle".');
    }

    if (value.origin !== undefined && (typeof value.origin !== "string" || !ORIGIN_VALUES.has(value.origin))) {
        throw new InvalidInjectCssOptionsError('"origin" must be "AUTHOR" or "USER".');
    }

    if (
        value.timeoutMs !== undefined &&
        (typeof value.timeoutMs !== "number" || !Number.isInteger(value.timeoutMs) || value.timeoutMs <= 0)
    ) {
        throw new InvalidInjectCssOptionsError('"timeoutMs" must be a positive integer.');
    }

    return {...(value as InjectCssExecutionOptions)};
};

export const validateInjectCssOptions = (
    value: unknown
): {target: InjectCssTarget; execution: InjectCssExecutionOptions} => {
    if (!isObject(value)) {
        throw new InvalidInjectCssOptionsError("options must be an object.");
    }

    assertKnownKeys(value, INJECT_CSS_OPTION_KEYS, "options");

    const {target, ...execution} = value;

    return {
        target: validateInjectCssTarget(target),
        execution: validateInjectCssExecutionOptions(execution),
    };
};

export const validateInjectCssCode = (value: unknown): string => {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new InvalidInjectCssCodeError("code must be a non-empty string.");
    }

    return value;
};

export const validateInjectCssFiles = (files: string | NonEmptyReadonlyArray<string>): string[] => {
    const fileList = typeof files === "string" ? [files] : files;

    if (!Array.isArray(fileList) || fileList.length === 0) {
        throw new InvalidInjectCssFilesError("at least one file is required.");
    }

    if (fileList.some(file => typeof file !== "string" || file.trim().length === 0)) {
        throw new InvalidInjectCssFilesError("each file must be a non-empty string.");
    }

    return [...fileList];
};
