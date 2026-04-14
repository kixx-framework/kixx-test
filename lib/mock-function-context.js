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

export default class MockFunctionContext {
    #calls;
    #implementation;
    #implementationOnce;
    #original;
    #restoreCallback;
    #times;
    #tracker;

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

    static createMockFunction(context) {
        return function mockFunction(...args) {
            // eslint-disable-next-line no-invalid-this
            return context.#invoke(this, args, new.target);
        };
    }

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
     * This function returns the number of times that this mock has been invoked.
     * @return {Number} The number of times that this mock has been invoked.
     */
    callCount() {
        return this.#calls.length;
    }

    /**
     * Return the call context from the call at the index.
     * @param {Number} index - The index number of the call context to retrieve. Zero indexed.
     * @return {CallContext}
     */
    getCall(index) {
        return this.#calls[index];
    }

    /**
     * This function is used to change the behavior of an existing mock.
     * @param {Function|AsyncFunction} implementation - The function to be used as the mock's new implementation.
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
     * This function is used to change the behavior of an existing mock for a single invocation. Once invocation onCall has occurred, the mock will revert to whatever behavior it would have used had mockImplementationOnce() not been called.
     * @param {Function|AsyncFunction} implementation - The function to be used as the mock's implementation for the invocation number specified by onCall.
     * @param {Number} onCall - The invocation number that will use implementation. If the specified invocation has already occurred then an exception is thrown. Default: The number of the next invocation.
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
     * Resets the call history of the mock function.
     */
    resetCalls() {
        this.#calls.length = 0;
        this.#implementationOnce.clear();
    }

    /**
     * Resets the implementation of the mock function to its original behavior. The mock can still be used after calling this function.
     */
    restore() {
        this.#restoreCallback?.();
    }
}
