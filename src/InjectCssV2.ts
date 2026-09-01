import {insertCssTab} from "@addon-core/browser";
import AbstractInjectCss from "./AbstractInjectCss";
import {InjectCssFrameDeliveryError, UnsupportedInjectCssOptionError, UnsupportedInjectCssTargetError} from "./errors";
import type {InjectCssExecutionOptions, InjectCssOptions, InjectCssTarget, NonEmptyReadonlyArray} from "./types";

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
        const details = this.createDetails(execution, {code});

        try {
            await this.withTimeout(this.execute(target, details), target, timeoutMs);
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

                await this.execute(target, this.createDetails(execution, {file}));
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

    protected assertAdapterSupport(target: InjectCssTarget, _execution: InjectCssExecutionOptions): void {
        if ("documentIds" in target && target.documentIds !== undefined) {
            throw new UnsupportedInjectCssTargetError('"documentIds" are not supported by the MV2 adapter.');
        }
    }

    private createDetails(
        execution: InjectCssExecutionOptions,
        source: Pick<InjectDetails, "code"> | Pick<InjectDetails, "file">
    ): InjectDetails {
        return {
            ...source,
            ...(execution.runAt !== undefined ? {runAt: execution.runAt} : {}),
            ...(execution.origin !== undefined ? {cssOrigin: execution.origin.toLowerCase() as CSSOrigin} : {}),
            ...(execution.matchAboutBlank !== undefined ? {matchAboutBlank: execution.matchAboutBlank} : {}),
        };
    }

    private async execute(target: InjectCssTarget, details: InjectDetails): Promise<void> {
        if ("allFrames" in target && target.allFrames === true) {
            await insertCssTab(target.tabId, {...details, allFrames: true});
            return;
        }

        if ("frameIds" in target && target.frameIds !== undefined) {
            await Promise.all(
                target.frameIds.map(frameId => this.executeFrame(target.tabId, frameId, {...details, frameId}))
            );
            return;
        }

        await insertCssTab(target.tabId, details);
    }

    private async executeFrame(tabId: number, frameId: number, details: InjectDetails): Promise<void> {
        try {
            await insertCssTab(tabId, details);
        } catch (error) {
            throw new InjectCssFrameDeliveryError(tabId, frameId, error);
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
