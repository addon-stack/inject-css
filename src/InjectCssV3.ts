import {insertCss} from "@addon-core/browser";
import AbstractInjectCss from "./AbstractInjectCss";
import {UnsupportedInjectCssOptionError, UnsupportedInjectCssTargetError} from "./errors";
import type {InjectCssExecutionOptions, InjectCssOptions, InjectCssTarget, NonEmptyReadonlyArray} from "./types";

type CSSInjection = chrome.scripting.CSSInjection;
type InjectionTarget = chrome.scripting.InjectionTarget;

export default class extends AbstractInjectCss {
    public constructor(options: InjectCssOptions) {
        super(options);
        this.assertAdapterSupport(this._target, this._execution);
    }

    public async insert(css: string): Promise<void> {
        this.validateCode(css);

        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;

        await this.execute(
            target,
            execution,
            {
                target: this.toNativeTarget(target),
                css,
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

    protected assertAdapterSupport(_target: InjectCssTarget, execution: InjectCssExecutionOptions): void {
        if (execution.matchAboutBlank !== undefined) {
            throw new UnsupportedInjectCssOptionError('"matchAboutBlank" is not supported by the MV3 adapter.');
        }

        if (execution.runAt !== undefined) {
            throw new UnsupportedInjectCssOptionError('"runAt" is not supported by the MV3 adapter.');
        }
    }

    private async execute(
        target: InjectCssTarget,
        execution: InjectCssExecutionOptions,
        injection: CSSInjection,
        timeoutMs: number
    ): Promise<void> {
        try {
            await this.withTimeout(insertCss(injection), target, timeoutMs);
        } catch (error) {
            if (this.isUnsupportedDocumentTargetError(target, error)) {
                throw new UnsupportedInjectCssTargetError(
                    '"documentIds" are not supported by the current browser.',
                    error
                );
            }

            this.throwUnsupportedOriginCapability(execution, error);
            throw this.deliveryError(target, error);
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

    private isUnsupportedDocumentTargetError(target: InjectCssTarget, error: unknown): boolean {
        if (!("documentIds" in target) || target.documentIds === undefined) {
            return false;
        }

        const message = error instanceof Error ? error.message : String(error);

        return (
            /documentIds?/i.test(message) &&
            /(not supported|unsupported|unexpected|unknown|unrecognized)\b/i.test(message)
        );
    }

    private throwUnsupportedOriginCapability(execution: InjectCssExecutionOptions, error: unknown): void {
        if (execution.origin === undefined) return;

        const message = error instanceof Error ? error.message : String(error);

        if (/\b(?:(?:css|style)[\s_-]*)?origin\b/i.test(message) && this.isUnsupportedCapabilityMessage(message)) {
            throw new UnsupportedInjectCssOptionError('"origin" is not supported by the current browser.', error);
        }
    }

    private isUnsupportedCapabilityMessage(message: string): boolean {
        // Native extension APIs expose validation failures as messages rather than stable error codes.
        // Keep this matcher paired with browser-message fixtures in tests.
        return /(not supported|unsupported|unexpected|unknown|unrecognized|invalid|not (?:a )?valid)\b/i.test(message);
    }
}
