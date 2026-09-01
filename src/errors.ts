import type {InjectCssTarget} from "./types";

export type InjectCssErrorCode =
    | "ERR_INJECT_CSS_DELIVERY"
    | "ERR_INJECT_CSS_INVALID_CODE"
    | "ERR_INJECT_CSS_INVALID_FILES"
    | "ERR_INJECT_CSS_INVALID_OPTIONS"
    | "ERR_INJECT_CSS_INVALID_TARGET"
    | "ERR_INJECT_CSS_TIMEOUT"
    | "ERR_INJECT_CSS_UNSUPPORTED_OPTION"
    | "ERR_INJECT_CSS_UNSUPPORTED_TARGET";

export class InjectCssBaseError extends Error {
    public readonly code: InjectCssErrorCode;
    public override readonly cause?: unknown;

    protected constructor(name: string, code: InjectCssErrorCode, message: string, cause?: unknown) {
        super(message);
        this.name = name;
        this.code = code;

        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

export class InvalidInjectCssTargetError extends InjectCssBaseError {
    public constructor(message: string) {
        super("InvalidInjectCssTargetError", "ERR_INJECT_CSS_INVALID_TARGET", `Invalid InjectCss target: ${message}`);
    }
}

export class UnsupportedInjectCssTargetError extends InjectCssBaseError {
    public constructor(message: string, cause?: unknown) {
        super(
            "UnsupportedInjectCssTargetError",
            "ERR_INJECT_CSS_UNSUPPORTED_TARGET",
            `Unsupported InjectCss target: ${message}`,
            cause
        );
    }
}

export class InvalidInjectCssOptionsError extends InjectCssBaseError {
    public constructor(message: string) {
        super(
            "InvalidInjectCssOptionsError",
            "ERR_INJECT_CSS_INVALID_OPTIONS",
            `Invalid InjectCss options: ${message}`
        );
    }
}

export class UnsupportedInjectCssOptionError extends InjectCssBaseError {
    public constructor(message: string, cause?: unknown) {
        super(
            "UnsupportedInjectCssOptionError",
            "ERR_INJECT_CSS_UNSUPPORTED_OPTION",
            `Unsupported InjectCss option: ${message}`,
            cause
        );
    }
}

export class InvalidInjectCssCodeError extends InjectCssBaseError {
    public constructor(message: string) {
        super("InvalidInjectCssCodeError", "ERR_INJECT_CSS_INVALID_CODE", `Invalid InjectCss code: ${message}`);
    }
}

export class InvalidInjectCssFilesError extends InjectCssBaseError {
    public constructor(message: string) {
        super("InvalidInjectCssFilesError", "ERR_INJECT_CSS_INVALID_FILES", `Invalid InjectCss files: ${message}`);
    }
}

export class InjectCssTimeoutError extends InjectCssBaseError {
    public readonly target: InjectCssTarget;
    public readonly timeoutMs: number;

    public constructor(target: InjectCssTarget, timeoutMs: number) {
        super("InjectCssTimeoutError", "ERR_INJECT_CSS_TIMEOUT", `CSS injection timed out after ${timeoutMs} ms.`);
        this.target = target;
        this.timeoutMs = timeoutMs;
    }
}

export class InjectCssDeliveryError extends InjectCssBaseError {
    public readonly target: InjectCssTarget;

    public constructor(target: InjectCssTarget, cause: unknown) {
        const message = cause instanceof Error ? cause.message : String(cause);

        super("InjectCssDeliveryError", "ERR_INJECT_CSS_DELIVERY", `CSS injection failed: ${message}`, cause);
        this.target = target;
    }
}
