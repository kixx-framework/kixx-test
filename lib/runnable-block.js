import { DEFAULT_TIMEOUT } from './constants.js';

/**
 * Executable unit for test hooks and test cases.
 * Supports promise-returning functions and callback-style functions.
 */
export default class RunnableBlock {

    type = null;
    namePath = [];
    fn = null;
    disabled = false;
    timeout = DEFAULT_TIMEOUT;
    setTimeout = null;

    /**
     * @param {Object} spec
     * @param {string} spec.type - Block type (`test`, `before`, or `after`).
     * @param {string[]} spec.namePath - Hierarchical block path including this block's name.
     * @param {Function|null} [spec.fn] - Function to execute for this block.
     * @param {boolean} [spec.disabled=false] - Whether execution should be skipped.
     * @param {number} [spec.timeout] - Execution timeout in milliseconds.
     * @param {Function} [spec.setTimeout=setTimeout] - Timeout scheduler (primarily for tests).
     * @param {Function} [spec.clearTimeout=clearTimeout] - Timeout canceller (primarily for tests).
     */
    constructor(spec) {
        this.type = spec.type;
        this.namePath = spec.namePath;
        this.fn = spec.fn;

        if (spec.disabled) {
            this.disabled = true;
        }

        if (Number.isInteger(spec.timeout)) {
            this.timeout = spec.timeout;
        }

        // Explicitly set the setTimeout function to allow for testing.
        this.setTimeout = spec.setTimeout || setTimeout;
        this.clearTimeout = spec.clearTimeout || clearTimeout;
    }

    /**
     * Returns the block name path joined with the provided delimiter.
     * @param {string} [delimiter=':']
     * @returns {string}
     */
    concatName(delimiter = ':') {
        return this.namePath.join(delimiter);
    }

    /**
     * Runs this block with timeout handling and multiple resolve/reject detection.
     * @param {import('./event-emitter.js').default} emitter - Event emitter used for runtime diagnostics.
     * @param {Object} [options]
     * @param {number} [options.timeout] - Overrides the block timeout for this execution.
     * @returns {Promise<null>}
     */
    run(emitter, options = {}) {
        if (this.disabled) {
            return Promise.resolve(null);
        }

        const block = this;
        const timeout = Number.isInteger(options.timeout) ? options.timeout : this.timeout;
        const setBlockTimeout = this.setTimeout;
        const clearBlockTimeout = this.clearTimeout;

        return new Promise((resolvePromise, rejectPromise) => {
            let resolved = false;

            const resolve = () => {
                // eslint-disable-next-line no-use-before-define
                clearBlockTimeout(timeoutHandle);
                if (resolved) {
                    const error = new Error('RunnableBlock resolved multiple times');
                    emitter.emit('multipleResolves', { block, error });
                } else {
                    resolved = true;
                    resolvePromise(null);
                }
            };

            const reject = (error) => {
                // eslint-disable-next-line no-use-before-define
                clearBlockTimeout(timeoutHandle);
                if (resolved) {
                    emitter.emit('multipleRejections', { block, error });
                } else {
                    resolved = true;
                    rejectPromise(error);
                }
            };

            const timeoutHandle = setBlockTimeout(() => {
                reject(new Error(`timed out in ${ timeout }ms`));
            }, timeout);

            if (typeof this.fn === 'function' && this.fn.length === 0) {
                // If the block function has zero parameters we assume it returns a
                // value synchronously or a promise.
                try {
                    Promise.resolve(this.fn()).then(resolve, reject);
                } catch (error) {
                    reject(error);
                }
            } else if (typeof this.fn === 'function') {
                // If the block function has more than 0 parameters then we assume
                // it is an asynchronous callback.
                try {
                    const res = this.fn((error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });

                    Promise.resolve(res).catch(reject);
                } catch (error) {
                    reject(error);
                }
            }
        });
    }
}
