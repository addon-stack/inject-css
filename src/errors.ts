import type {InjectCssOperation, InjectCssTarget} from "./types";

export type InjectCssErrorCode =
    | "ERR_INJECT_CSS_DELIVERY"
    | "ERR_INJECT_CSS_INVALID_CODE"
    | "ERR_INJECT_CSS_INVALID_FILES"
    | "ERR_INJECT_CSS_INVALID_OPTIONS"
    | "ERR_INJECT_CSS_INVALID_TARGET"
    | "ERR_INJECT_CSS_TIMEOUT"
    | "ERR_INJECT_CSS_UNSUPPORTED_OPTION"
    | "ERR_INJECT_CSS_UNSUPPORTED_OPERATION"
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

export class UnsupportedInjectCssOperationError extends InjectCssBaseError {
    public readonly operation: InjectCssOperation;

    public constructor(operation: InjectCssOperation, message: string, cause?: unknown) {
        super(
            "UnsupportedInjectCssOperationError",
            "ERR_INJECT_CSS_UNSUPPORTED_OPERATION",
            `Unsupported InjectCss operation "${operation}": ${message}`,
            cause
        );
        this.operation = operation;
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
    public readonly operation: InjectCssOperation;

    public constructor(target: InjectCssTarget, timeoutMs: number, operation: InjectCssOperation = "insert") {
        const action = operation === "insert" ? "injection" : "removal";

        super("InjectCssTimeoutError", "ERR_INJECT_CSS_TIMEOUT", `CSS ${action} timed out after ${timeoutMs} ms.`);
        this.target = target;
        this.timeoutMs = timeoutMs;
        this.operation = operation;
    }
}

export class InjectCssDeliveryError extends InjectCssBaseError {
    public readonly target: InjectCssTarget;
    public readonly operation: InjectCssOperation;

    public constructor(target: InjectCssTarget, cause: unknown, operation: InjectCssOperation = "insert") {
        const message = cause instanceof Error ? cause.message : String(cause);
        const action = operation === "insert" ? "injection" : "removal";

        super("InjectCssDeliveryError", "ERR_INJECT_CSS_DELIVERY", `CSS ${action} failed: ${message}`, cause);
        this.target = target;
        this.operation = operation;
    }
}

export class InjectCssFrameDeliveryError extends Error {
    public readonly tabId: number;
    public readonly frameId: number;
    public readonly operation: InjectCssOperation;
    public override readonly cause: unknown;

    public constructor(tabId: number, frameId: number, cause: unknown, operation: InjectCssOperation = "insert") {
        const message = cause instanceof Error ? cause.message : String(cause);
        const action = operation === "insert" ? "injection" : "removal";

        super(`CSS ${action} failed in frame ${frameId} of tab ${tabId}: ${message}`);
        this.name = "InjectCssFrameDeliveryError";
        this.tabId = tabId;
        this.frameId = frameId;
        this.operation = operation;
        this.cause = cause;
    }
}
