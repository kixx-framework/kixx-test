/* eslint-disable no-unused-private-class-members */
import ProgrammerError from './programmer-error.js';

/**
 * @typedef {Object} CallContext
 * @property {Array} arguments - An array of the arguments passed to the mock function.
 * @property {*} error - If the mocked function threw then this property contains the thrown value. Default: undefined.
 * @property {*} result - The value returned by the mocked function.
 * @property {Function|undefined} target - If the mocked function is a constructor, this field contains the class being constructed. Otherwise this will be undefined.
 * @property {*} this - The mocked function's this value.
 */

function noop() {
}

function isFunction(value) {
    return typeof value === 'function';
}

/**
 * Internal state holder for a single mocked function or method.
 */
export default class MockFunctionContext {
    #calls;
    #implementation;
    #implementationOnce;
    #original;
    #restoreCallback;
    #times;
    #tracker;

    /**
     * @param {Object} [args]
     * @param {CallContext[]} [args.calls=[]] - Captured invocation history.
     * @param {Function|undefined} [args.implementation] - Active implementation used by the mock.
     * @param {Map<number, Function>} [args.implementationOnce=new Map()] - Call-indexed one-time implementations.
     * @param {Function|undefined} [args.original] - Original function before mocking.
     * @param {Function|undefined} [args.restoreCallback] - Callback used by restore() to reattach original behavior.
     * @param {number|undefined} [args.times] - Remaining calls before auto-restore.
     * @param {import('./mock-tracker.js').default|undefined} [args.tracker] - Owning tracker instance.
     */
    constructor(args) {
        const {
            calls = [],
            implementation,
            implementationOnce = new Map(),
            original,
            restoreCallback,
            times,
            tracker,
        } = args ?? {};

        this.#calls = calls;
        this.#implementation = implementation;
        this.#implementationOnce = implementationOnce;
        this.#original = original;
        this.#restoreCallback = restoreCallback ?? (() => {
            this.#implementation = this.#original;
        });
        this.#times = times;
        this.#tracker = tracker;
    }

    /**
     * Creates an executable mock function bound to this context.
     * @param {MockFunctionContext} context
     * @returns {Function}
     */
    static createMockFunction(context) {
        return function mockFunction(...args) {
            // eslint-disable-next-line no-invalid-this
            return context.#invoke(this, args, new.target);
        };
    }

    /**
     * Detaches this context from its tracker so tracker-wide operations no longer affect it.
     */
    disassociateTracker() {
        this.#tracker = undefined;
    }

    #invoke(thisArg, args, newTarget) {
        const callIndex = this.#calls.length;
        const implementation = this.#implementationOnce.get(callIndex) ??
            this.#implementation ??
            this.#original ??
            noop;
        let error;
        let hasError = false;
        let result;

        this.#implementationOnce.delete(callIndex);

        try {
            if (newTarget) {
                result = Reflect.construct(implementation, args, newTarget);
            } else {
                result = Reflect.apply(implementation, thisArg, args);
            }
        } catch (caught) {
            error = caught;
            hasError = true;
        }

        const call = Object.freeze({
            arguments: Array.from(args),
            error,
            result,
            target: newTarget,
            this: thisArg,
        });

        this.#calls.push(call);

        if (this.#times !== undefined) {
            this.#times -= 1;

            if (this.#times === 0) {
                this.#restoreCallback?.();
                this.#times = undefined;
            }
        }

        if (hasError) {
            throw error;
        }

        return result;
    }

    /**
     * Returns the number of times this mock has been invoked.
     * @returns {number}
     */
    callCount() {
        return this.#calls.length;
    }

    /**
     * Returns the call context captured at the provided zero-based index.
     * @param {number} index
     * @returns {CallContext|undefined}
     */
    getCall(index) {
        return this.#calls[index];
    }

    /**
     * Replaces the current mock implementation for all future calls.
     * @param {Function|AsyncFunction} implementation
     * @throws {ProgrammerError} When implementation is not a function.
     */
    mockImplementation(implementation) {
        if (!isFunction(implementation)) {
            throw new ProgrammerError(
                'First argument to mockImplementation() must be a function',
                {},
                MockFunctionContext.prototype.mockImplementation,
            );
        }

        this.#implementation = implementation;
    }

    /**
     * Sets a one-time implementation for a specific invocation index.
     * After that call, the mock resumes its normal implementation selection.
     * @param {Function|AsyncFunction} implementation
     * @param {number} [onCall] - Zero-based call index to override. Defaults to next call.
     * @throws {ProgrammerError} When implementation is not a function.
     * @throws {ProgrammerError} When onCall is not a non-negative integer.
     * @throws {ProgrammerError} When onCall references a call that already happened.
     */
    mockImplementationOnce(implementation, onCall) {
        const callIndex = onCall ?? this.callCount();

        if (!isFunction(implementation)) {
            throw new ProgrammerError(
                'First argument to mockImplementationOnce() must be a function',
                {},
                MockFunctionContext.prototype.mockImplementationOnce,
            );
        }

        if (!Number.isInteger(callIndex) || callIndex < 0) {
            throw new ProgrammerError(
                'Second argument to mockImplementationOnce() must be a non-negative integer',
                {},
                MockFunctionContext.prototype.mockImplementationOnce,
            );
        }

        if (callIndex < this.callCount()) {
            throw new ProgrammerError(
                'Second argument to mockImplementationOnce() cannot refer to a call that has already occurred',
                {},
                MockFunctionContext.prototype.mockImplementationOnce,
            );
        }

        this.#implementationOnce.set(callIndex, implementation);
    }

    /**
     * Clears call history and one-time implementations.
     */
    resetCalls() {
        this.#calls.length = 0;
        this.#implementationOnce.clear();
    }

    /**
     * Restores the original behavior for this mock while keeping call history.
     */
    restore() {
        this.#restoreCallback?.();
    }
}
