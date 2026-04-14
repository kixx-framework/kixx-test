import ProgrammerError from './lib/programmer-error.js';
import { DEFAULT_TIMEOUT } from './lib/constants.js';
import DescribeBlock from './lib/describe-block.js';
import EventEmitter from './lib/event-emitter.js';
export { default as MockTracker } from './lib/mock-tracker.js';

export const _rootBlocks = [];
let _runCalled = false;

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
