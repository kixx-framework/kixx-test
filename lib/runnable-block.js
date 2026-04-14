import { DEFAULT_TIMEOUT } from './constants.js';

export default class RunnableBlock {

    type = null;
    namePath = [];
    fn = null;
    disabled = false;
    timeout = DEFAULT_TIMEOUT;
    setTimeout = null;

    /**
     * Creates a new RunnableBlock instance
     * @param {Object} spec - The specification object
     * @param {string} spec.type - The type of the block. "test", "before", or "after"
     * @param {string[]} spec.namePath - Ancestor block names (strings), including name of this block
     * @param {Function} spec.fn - The function to run
     * @param {boolean} [spec.disabled] - Whether the block is disabled
     * @param {number} [spec.timeout] - Timeout in milliseconds
     * @param {Function} [spec.setTimeout=setTimeout] - The function to use for setting a timeout (used for testing)
     * @param {Function} [spec.clearTimeout=clearTimeout] - The function to use for clearing a timeout (used for testing)
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

    concatName(delimiter = ':') {
        return this.namePath.join(delimiter);
    }

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
