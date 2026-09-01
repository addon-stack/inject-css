import {browser, insertCssTab, removeCssTab} from "@addon-core/browser";
import AbstractInjectCss from "./AbstractInjectCss";
import {
    InjectCssFrameDeliveryError,
    UnsupportedInjectCssOperationError,
    UnsupportedInjectCssOptionError,
    UnsupportedInjectCssTargetError,
} from "./errors";
import type {
    InjectCssExecutionOptions,
    InjectCssOperation,
    InjectCssOptions,
    InjectCssTarget,
    NonEmptyReadonlyArray,
} from "./types";

type CSSOrigin = chrome.extensionTypes.CSSOrigin;
type InjectDetails = chrome.extensionTypes.InjectDetails;

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
        const details = this.createDetails("insert", execution, {code});

        try {
            await this.withTimeout(this.execute("insert", target, details), target, timeoutMs);
        } catch (error) {
            this.throwUnsupportedOriginCapability(execution, error);
            throw this.deliveryError(target, error);
        }
    }

    public async file(files: string | NonEmptyReadonlyArray<string>): Promise<void> {
        const fileList = this.normalizeFiles(files);
        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;
        let stopped = false;

        const task = (async (): Promise<void> => {
            for (const file of fileList) {
                if (stopped) return;

                await this.execute("insert", target, this.createDetails("insert", execution, {file}));
            }
        })();

        try {
            await this.withTimeout(task, target, timeoutMs);
        } catch (error) {
            stopped = true;
            this.throwUnsupportedOriginCapability(execution, error);
            throw this.deliveryError(target, error);
        }
    }

    public async remove(css: string): Promise<void> {
        const code = this.validateCode(css);

        await this.removeSource({code});
    }

    public async removeFile(files: string | NonEmptyReadonlyArray<string>): Promise<void> {
        const fileList = this.normalizeFiles(files);
        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;
        let stopped = false;

        this.assertRemovalSupport();

        const task = (async (): Promise<void> => {
            for (const file of fileList) {
                if (stopped) return;

                await this.execute("remove", target, this.createDetails("remove", execution, {file}));
            }
        })();

        try {
            await this.withTimeout(task, target, timeoutMs, "remove");
        } catch (error) {
            stopped = true;
            this.throwUnsupportedRemovalCapability(error);
            this.throwUnsupportedOriginCapability(execution, error);
            throw this.deliveryError(target, error, "remove");
        }
    }

    protected assertAdapterSupport(target: InjectCssTarget, _execution: InjectCssExecutionOptions): void {
        if ("documentIds" in target && target.documentIds !== undefined) {
            throw new UnsupportedInjectCssTargetError('"documentIds" are not supported by the MV2 adapter.');
        }
    }

    private createDetails(
        operation: InjectCssOperation,
        execution: InjectCssExecutionOptions,
        source: Pick<InjectDetails, "code"> | Pick<InjectDetails, "file">
    ): InjectDetails {
        return {
            ...source,
            ...(operation === "insert" && execution.runAt !== undefined ? {runAt: execution.runAt} : {}),
            ...(execution.origin !== undefined ? {cssOrigin: execution.origin.toLowerCase() as CSSOrigin} : {}),
            ...(execution.matchAboutBlank !== undefined ? {matchAboutBlank: execution.matchAboutBlank} : {}),
        };
    }

    private async execute(
        operation: InjectCssOperation,
        target: InjectCssTarget,
        details: InjectDetails
    ): Promise<void> {
        const deliver = operation === "insert" ? insertCssTab : removeCssTab;

        if ("allFrames" in target && target.allFrames === true) {
            await deliver(target.tabId, {...details, allFrames: true});
            return;
        }

        if ("frameIds" in target && target.frameIds !== undefined) {
            await Promise.all(
                target.frameIds.map(frameId =>
                    this.executeFrame(operation, target.tabId, frameId, {...details, frameId})
                )
            );
            return;
        }

        await deliver(target.tabId, details);
    }

    private async executeFrame(
        operation: InjectCssOperation,
        tabId: number,
        frameId: number,
        details: InjectDetails
    ): Promise<void> {
        try {
            const deliver = operation === "insert" ? insertCssTab : removeCssTab;

            await deliver(tabId, details);
        } catch (error) {
            throw new InjectCssFrameDeliveryError(tabId, frameId, error, operation);
        }
    }

    private async removeSource(source: Pick<InjectDetails, "code"> | Pick<InjectDetails, "file">): Promise<void> {
        const target = this.snapshotTarget();
        const execution = this.snapshotExecution();
        const timeoutMs = this.timeoutMs;

        this.assertRemovalSupport();

        try {
            await this.withTimeout(
                this.execute("remove", target, this.createDetails("remove", execution, source)),
                target,
                timeoutMs,
                "remove"
            );
        } catch (error) {
            this.throwUnsupportedRemovalCapability(error);
            this.throwUnsupportedOriginCapability(execution, error);
            throw this.deliveryError(target, error, "remove");
        }
    }

    private assertRemovalSupport(): void {
        if (typeof browser().tabs?.removeCSS !== "function") {
            throw new UnsupportedInjectCssOperationError(
                "remove",
                'the current MV2 browser does not expose "tabs.removeCSS".'
            );
        }
    }

    private throwUnsupportedRemovalCapability(error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);

        if (
            /remove\s*css/i.test(message) &&
            /(not supported|unsupported|not (?:available|implemented)|is not a function)\b/i.test(message)
        ) {
            throw new UnsupportedInjectCssOperationError(
                "remove",
                'the current MV2 browser does not support "tabs.removeCSS".',
                error
            );
        }
    }

    private throwUnsupportedOriginCapability(execution: InjectCssExecutionOptions, error: unknown): void {
        if (execution.origin === undefined) return;

        const message = error instanceof Error ? error.message : String(error);

        if (
            /\b(?:css[\s_-]*)?origin\b/i.test(message) &&
            /(not supported|unsupported|unexpected|unknown|unrecognized)\b/i.test(message)
        ) {
            throw new UnsupportedInjectCssOptionError('"origin" is not supported by the current browser.', error);
        }
    }
}
