import ProgrammerError from './lib/programmer-error.js';
import { DEFAULT_TIMEOUT } from './lib/constants.js';
import DescribeBlock from './lib/describe-block.js';
import EventEmitter from './lib/event-emitter.js';
export { default as MockTracker } from './lib/mock-tracker.js';

/**
 * Public API for defining and executing Kixx test suites.
 * @module kixx-test
 */

/**
 * @typedef {import('./lib/describe-block.js').default} DescribeBlockType
 */

/**
 * @typedef {import('./lib/event-emitter.js').default} EventEmitterType
 */

/**
 * Registration functions available inside a `describe()` callback.
 * @typedef {Object} DescribeInterface
 * @property {Function} before - Registers a `before` hook.
 * @property {Function} after - Registers an `after` hook.
 * @property {Function} it - Registers a test block.
 * @property {Function} describe - Registers a nested describe block.
 * @property {Function} xit - Registers a disabled test block.
 * @property {Function} xdescribe - Registers a disabled describe block.
 */

/**
 * @callback DescribeCallback
 * @param {DescribeInterface} block - Interface used to register hooks, tests, and nested describe blocks.
 * @returns {void}
 */

/**
 * Emitted when a describe block starts executing.
 * @typedef {Object} DescribeBlockStartEvent
 * @property {DescribeBlockType} block - Describe block being entered.
 */

/**
 * Emitted after each runnable block finishes.
 * @typedef {Object} BlockCompleteEvent
 * @property {import('./lib/runnable-block.js').default} block - Runnable block that completed.
 * @property {number} start - Epoch timestamp in milliseconds when execution started.
 * @property {number} end - Epoch timestamp in milliseconds when execution ended.
 * @property {Error|null} error - Error thrown by the block, if any.
 */

/**
 * Top-level describe blocks for the current process.
 * Exposed for test harnesses and integrations that need direct runtime inspection.
 * @private
 * @type {DescribeBlockType[]}
 */
export const _rootBlocks = [];
let _runCalled = false;

/**
 * Registers a top-level describe block.
 * If called with only `name`, the block is created in a disabled state.
 * @param {string} name - Display name of the describe block.
 * @param {DescribeCallback} [fn] - Callback that registers hooks, tests, and nested describes.
 * @param {Object} [opts]
 * @param {boolean} [opts.disabled=false] - When true, marks this describe block as disabled.
 * @param {number} [opts.timeout=DEFAULT_TIMEOUT] - Default timeout for blocks inside this describe.
 * @returns {void}
 * @throws {ProgrammerError} When `name` is not a string.
 * @throws {ProgrammerError} When `fn` is provided and is not a function.
 */
export function describe(name, fn, opts = {}) {
    if (!name || typeof name !== 'string') {
        throw new ProgrammerError('First argument to describe() must be a string', {}, describe);
    }

    let disabled = false;
    // If only a name argument is given, this block is considered to be disabled.
    if (opts.disabled || arguments.length === 1) {
        disabled = true;
    }

    if (arguments.length > 1 && typeof fn !== 'function') {
        throw new ProgrammerError('Second argument to describe() must be a function', {}, describe);
    }

    const timeout = Number.isInteger(opts.timeout) ? opts.timeout : DEFAULT_TIMEOUT;

    const newBlock = new DescribeBlock({
        namePath: [ name ],
        disabled,
        timeout,
    });

    _rootBlocks.push(newBlock);

    if (fn) {
        fn(newBlock.createInterface());
    }
}

/**
 * Runs all registered top-level describe blocks in registration order.
 * @param {Object} [options]
 * @param {EventEmitterType} [options.emitter] - Event emitter to receive runtime events.
 * @param {number} [options.timeout] - Optional timeout override passed to runnable blocks.
 * @returns {EventEmitterType} Emitter used to observe execution progress and completion.
 * @throws {ProgrammerError} When called more than once in the same process.
 * @emits EventEmitter#describeBlockStart - Emits a {@link DescribeBlockStartEvent}.
 * @emits EventEmitter#blockComplete - Emits a {@link BlockCompleteEvent}.
 * @emits EventEmitter#complete - Emits once all root blocks have been processed.
 * @emits EventEmitter#error - Emits when an execution error bubbles to the runner.
 */
export function runTests(options = {}) {
    if (_runCalled) {
        throw new ProgrammerError('run() has already been called in this session');
    }

    _runCalled = true;

    const emitter = options.emitter || new EventEmitter();

    const finalPromise = _rootBlocks.reduce((promise, block) => {
        return promise.then(() => walkBlock(emitter, options, block));
    }, Promise.resolve(null));

    finalPromise.then(function onComplete() {
        emitter.emit('complete');
    }, function onError(error) {
        emitter.emit('error', error);
    });

    return emitter;
}

/**
 * Executes a describe block and its contained hooks, tests, and nested describes.
 * The execution order is: `before` hooks, tests, child describe blocks, then `after` hooks.
 * A failing `before` hook prevents tests and child describes in that block from running.
 * @param {EventEmitterType} emitter - Runtime event emitter.
 * @param {Object} options - Runtime options forwarded to runnable blocks.
 * @param {DescribeBlockType} describeBlock - Describe block to execute.
 * @returns {Promise<void>}
 */
async function walkBlock(emitter, options, describeBlock) {
    let beforeblockFailure = false;

    const {
        beforeBlocks,
        testBlocks,
        afterBlocks,
        childBlocks,
    } = describeBlock;

    emitter.emit('describeBlockStart', { block: describeBlock });

    for (const block of beforeBlocks) {
        if (beforeblockFailure) {
            // Always stop testing this block if there is a failure in the before block.
            break;
        }

        const start = Date.now();
        let error = null;

        try {
            // eslint-disable-next-line no-await-in-loop
            await block.run(emitter, options);
        } catch (err) {
            error = err;
            beforeblockFailure = true;
        } finally {
            const end = Date.now();
            emitter.emit('blockComplete', { block, start, end, error });
        }
    }

    // Always stop testing this block if there is a failure in the before block.
    if (!beforeblockFailure) {
        for (const block of testBlocks) {
            if (beforeblockFailure) {
                break;
            }

            const start = Date.now();
            let error = null;
            try {
                // eslint-disable-next-line no-await-in-loop
                await block.run(emitter, options);
            } catch (err) {
                error = err;
            } finally {
                const end = Date.now();
                emitter.emit('blockComplete', { block, start, end, error });
            }
        }

        for (const child of childBlocks) {
            // eslint-disable-next-line no-await-in-loop
            await walkBlock(emitter, options, child);
        }
    }

    for (const block of afterBlocks) {
        const start = Date.now();
        let error = null;
        try {
            // eslint-disable-next-line no-await-in-loop
            await block.run(emitter, options);
        } catch (err) {
            error = err;
        } finally {
            const end = Date.now();
            emitter.emit('blockComplete', { block, start, end, error });
        }
    }
}
