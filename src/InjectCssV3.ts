import {browser, insertCss, removeCss} from "@addon-core/browser";
import AbstractInjectCss from "./AbstractInjectCss";
import {
    UnsupportedInjectCssOperationError,
    UnsupportedInjectCssOptionError,
    UnsupportedInjectCssTargetError,
} from "./errors";
import {
    isUnsupportedDocumentTargetCapabilityError,
    isUnsupportedOriginCapabilityError,
    isUnsupportedRemovalCapabilityError,
} from "./native-errors";
import type {
    InjectCssExecutionOptions,
    InjectCssOperation,
    InjectCssOptions,
    InjectCssTarget,
    NonEmptyReadonlyArray,
} from "./types";

type CSSInjection = chrome.scripting.CSSInjection;
type InjectionTarget = chrome.scripting.InjectionTarget;
type CSSSource = {css: string; files?: never} | {files: string[]; css?: never};

export default class extends AbstractInjectCss {
    public constructor(options: InjectCssOptions) {
        super(options);
        this.assertAdapterSupport(this._target, this._execution);
    }

    public async insert(css: string): Promise<void> {
        const code = this.validateCode(css);

        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;

        await this.execute(
            "insert",
            target,
            execution,
            {
                target: this.toNativeTarget(target),
                css: code,
                ...(execution.origin !== undefined ? {origin: execution.origin} : {}),
            },
            timeoutMs
        );
    }

    public async file(files: string | NonEmptyReadonlyArray<string>): Promise<void> {
        const fileList = this.normalizeFiles(files);
        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;

        await this.execute(
            "insert",
            target,
            execution,
            {
                target: this.toNativeTarget(target),
                files: fileList,
                ...(execution.origin !== undefined ? {origin: execution.origin} : {}),
            },
            timeoutMs
        );
    }

    public async remove(css: string): Promise<void> {
        const code = this.validateCode(css);

        await this.removeInjection({css: code});
    }

    public async removeFile(files: string | NonEmptyReadonlyArray<string>): Promise<void> {
        const fileList = this.normalizeFiles(files);

        await this.removeInjection({files: fileList});
    }

    protected assertAdapterSupport(_target: InjectCssTarget, execution: InjectCssExecutionOptions): void {
        if (execution.matchAboutBlank !== undefined) {
            throw new UnsupportedInjectCssOptionError('"matchAboutBlank" is not supported by the MV3 adapter.');
        }

        if (execution.runAt !== undefined) {
            throw new UnsupportedInjectCssOptionError('"runAt" is not supported by the MV3 adapter.');
        }
    }

    private async execute(
        operation: InjectCssOperation,
        target: InjectCssTarget,
        execution: InjectCssExecutionOptions,
        injection: CSSInjection,
        timeoutMs: number
    ): Promise<void> {
        try {
            const task = operation === "insert" ? insertCss(injection) : removeCss(injection);

            await this.withTimeout(task, target, timeoutMs, operation);
        } catch (error) {
            if (
                "documentIds" in target &&
                target.documentIds !== undefined &&
                isUnsupportedDocumentTargetCapabilityError(error)
            ) {
                throw new UnsupportedInjectCssTargetError(
                    '"documentIds" are not supported by the current browser.',
                    error
                );
            }

            if (operation === "remove" && isUnsupportedRemovalCapabilityError(error)) {
                throw new UnsupportedInjectCssOperationError(
                    "remove",
                    'the current MV3 browser does not support "scripting.removeCSS".',
                    error
                );
            }

            if (execution.origin !== undefined && isUnsupportedOriginCapabilityError(error)) {
                throw new UnsupportedInjectCssOptionError('"origin" is not supported by the current browser.', error);
            }

            throw this.deliveryError(target, error, operation);
        }
    }

    private async removeInjection(source: CSSSource): Promise<void> {
        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;

        this.assertRemovalSupport();

        await this.execute(
            "remove",
            target,
            execution,
            {
                target: this.toNativeTarget(target),
                ...source,
                ...(execution.origin !== undefined ? {origin: execution.origin} : {}),
            },
            timeoutMs
        );
    }

    private assertRemovalSupport(): void {
        if (typeof browser().scripting?.removeCSS !== "function") {
            throw new UnsupportedInjectCssOperationError(
                "remove",
                'the current MV3 browser does not expose "scripting.removeCSS".'
            );
        }
    }

    private toNativeTarget(target: InjectCssTarget): InjectionTarget {
        if ("frameIds" in target && target.frameIds !== undefined) {
            return {tabId: target.tabId, frameIds: [...target.frameIds]};
        }

        if ("documentIds" in target && target.documentIds !== undefined) {
            return {tabId: target.tabId, documentIds: [...target.documentIds]};
        }

        if ("allFrames" in target && target.allFrames === true) {
            return {tabId: target.tabId, allFrames: true};
        }

        return {tabId: target.tabId};
    }
}
