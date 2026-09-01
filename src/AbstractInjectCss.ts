import {InjectCssDeliveryError, InjectCssTimeoutError} from "./errors";
import {
    validateInjectCssCode,
    validateInjectCssExecutionOptions,
    validateInjectCssFiles,
    validateInjectCssOptions,
    validateInjectCssTarget,
} from "./validation";
import type {
    InjectCssContract,
    InjectCssExecutionOptions,
    InjectCssExecutionOptionsPatch,
    InjectCssOperation,
    InjectCssOptions,
    InjectCssTarget,
    NonEmptyReadonlyArray,
} from "./types";

const DEFAULT_TIMEOUT_MS = 4_000;

export default abstract class implements InjectCssContract {
    protected _target: InjectCssTarget;
    protected _execution: InjectCssExecutionOptions;

    public constructor(options: InjectCssOptions) {
        const normalized = validateInjectCssOptions(options);

        this._target = normalized.target;
        this._execution = normalized.execution;
    }

    public target(target: InjectCssTarget): this {
        const normalizedTarget = validateInjectCssTarget(target);

        this.assertAdapterSupport(normalizedTarget, this._execution);
        this._target = normalizedTarget;

        return this;
    }

    public options(options: InjectCssExecutionOptionsPatch): this {
        const normalizedOptions = validateInjectCssExecutionOptions(options);
        const nextExecution = {...this._execution, ...normalizedOptions};

        this.assertAdapterSupport(this._target, nextExecution);
        this._execution = nextExecution;

        return this;
    }

    public abstract insert(css: string): Promise<void>;

    public abstract file(files: string | NonEmptyReadonlyArray<string>): Promise<void>;

    public abstract remove(css: string): Promise<void>;

    public abstract removeFile(files: string | NonEmptyReadonlyArray<string>): Promise<void>;

    protected abstract assertAdapterSupport(target: InjectCssTarget, execution: InjectCssExecutionOptions): void;

    protected validateCode(css: string): string {
        return validateInjectCssCode(css);
    }

    protected normalizeFiles(files: string | NonEmptyReadonlyArray<string>): string[] {
        return validateInjectCssFiles(files);
    }

    protected snapshotTarget(): InjectCssTarget {
        return validateInjectCssTarget(this._target);
    }

    protected snapshotExecution(): InjectCssExecutionOptions {
        return {...this._execution};
    }

    protected get timeoutMs(): number {
        return this._execution.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    protected async withTimeout<T>(
        task: Promise<T>,
        target: InjectCssTarget,
        timeoutMs: number,
        operation: InjectCssOperation = "insert"
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let settled = false;

            const finish = (callback: () => void): void => {
                if (settled) return;

                settled = true;
                clearTimeout(timeoutId);
                callback();
            };

            const timeoutId = setTimeout(() => {
                finish(() => reject(new InjectCssTimeoutError(target, timeoutMs, operation)));
            }, timeoutMs);

            task.then(
                value => finish(() => resolve(value)),
                error => finish(() => reject(error))
            );
        });
    }

    protected deliveryError(target: InjectCssTarget, error: unknown, operation: InjectCssOperation = "insert"): Error {
        if (error instanceof InjectCssDeliveryError || error instanceof InjectCssTimeoutError) {
            return error;
        }

        return new InjectCssDeliveryError(target, error, operation);
    }
}
