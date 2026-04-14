/* eslint-disable no-unused-private-class-members */
import MockFunctionContext from './mock-function-context.js';
import ProgrammerError from './programmer-error.js';

function noop() {
}

function isFunction(value) {
    return typeof value === 'function';
}

function isObject(value) {
    return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

/**
 * Factory and lifecycle manager for function and method mocks.
 */
export default class MockTracker {
    #contexts = [];

    #register(context) {
        this.#contexts.push(context);
    }

    /**
     * Creates a standalone mock function with a `.mock` context property.
     * @param {Function|AsyncFunction} [original] - Original function to wrap. Defaults to a no-op.
     * @param {Function|AsyncFunction} [implementation] - Initial mock behavior. Defaults to original.
     * @param {Object} [options]
     * @param {number} [options.times] - Calls before auto-restore. Must be an integer greater than zero.
     * @returns {Function}
     * @throws {ProgrammerError} When original is provided and is not a function.
     * @throws {ProgrammerError} When implementation is provided and is not a function.
     * @throws {ProgrammerError} When options.times is not an integer greater than zero.
     */
    fn(original, implementation, options) {
        const { times } = options ?? {};

        if (original !== undefined && !isFunction(original)) {
            throw new ProgrammerError('First argument to mock.fn() must be a function', {}, MockTracker.prototype.fn);
        }

        if (implementation !== undefined && !isFunction(implementation)) {
            throw new ProgrammerError('Second argument to mock.fn() must be a function', {}, MockTracker.prototype.fn);
        }

        if (times !== undefined && (!Number.isInteger(times) || times < 1)) {
            throw new ProgrammerError('options.times for mock.fn() must be an integer greater than zero', {}, MockTracker.prototype.fn);
        }

        const originalFunction = original ?? noop;
        const implementationFunction = implementation ?? originalFunction;
        const context = new MockFunctionContext({
            implementation: implementationFunction,
            original: originalFunction,
            times,
            tracker: this,
        });
        const mockFunction = MockFunctionContext.createMockFunction(context);

        Object.defineProperty(mockFunction, 'length', {
            configurable: true,
            value: originalFunction.length,
        });

        Object.defineProperty(mockFunction, 'mock', {
            configurable: true,
            value: context,
        });

        this.#register(context);

        return mockFunction;
    }

    /**
     * Replaces an object method/getter/setter with a mock and returns the replacement function.
     * @param {Object} object - Target object containing the property to mock.
     * @param {string|symbol} methodName - Property key to mock.
     * @param {Function|AsyncFunction} [implementation] - Initial mock behavior. Defaults to original property function.
     * @param {Object} [options]
     * @param {boolean} [options.getter=false] - Mock the property's getter instead of value.
     * @param {boolean} [options.setter=false] - Mock the property's setter instead of value.
     * @param {number} [options.times] - Calls before auto-restore. Must be an integer greater than zero.
     * @returns {Function}
     * @throws {ProgrammerError} When object is not object-like.
     * @throws {ProgrammerError} When getter and setter are both true.
     * @throws {ProgrammerError} When implementation is provided and is not a function.
     * @throws {ProgrammerError} When options.times is not an integer greater than zero.
     * @throws {ProgrammerError} When target property does not resolve to a function.
     */
    method(object, methodName, implementation, options) {
        const {
            getter = false,
            setter = false,
            times,
        } = options ?? {};

        if (!isObject(object)) {
            throw new ProgrammerError('First argument to mock.method() must be an object', {}, MockTracker.prototype.method);
        }

        if (getter && setter) {
            throw new ProgrammerError('mock.method() cannot mock a getter and setter at the same time', {}, MockTracker.prototype.method);
        }

        if (implementation !== undefined && !isFunction(implementation)) {
            throw new ProgrammerError('Third argument to mock.method() must be a function', {}, MockTracker.prototype.method);
        }

        if (times !== undefined && (!Number.isInteger(times) || times < 1)) {
            throw new ProgrammerError('options.times for mock.method() must be an integer greater than zero', {}, MockTracker.prototype.method);
        }

        const foundDescriptor = Object.getOwnPropertyDescriptor(object, methodName);
        let original = object[methodName];

        if (getter) {
            original = foundDescriptor?.get;
        } else if (setter) {
            original = foundDescriptor?.set;
        }

        if (!isFunction(original)) {
            throw new ProgrammerError('The target property for mock.method() must be a function', {}, MockTracker.prototype.method);
        }

        const originalDescriptor = foundDescriptor ?? {
            configurable: true,
            enumerable: true,
            value: original,
            writable: true,
        };
        const implementationFunction = implementation ?? original;
        const restoreCallback = () => {
            Object.defineProperty(object, methodName, originalDescriptor);
        };

        const context = new MockFunctionContext({
            implementation: implementationFunction,
            original,
            restoreCallback,
            times,
            tracker: this,
        });

        const mockFunction = MockFunctionContext.createMockFunction(context);

        Object.defineProperty(mockFunction, 'length', {
            configurable: true,
            value: original.length,
        });

        Object.defineProperty(mockFunction, 'mock', {
            configurable: true,
            value: context,
        });

        if (getter) {
            Object.defineProperty(object, methodName, {
                configurable: originalDescriptor.configurable,
                enumerable: originalDescriptor.enumerable,
                get: mockFunction,
                set: originalDescriptor.set,
            });
        } else if (setter) {
            Object.defineProperty(object, methodName, {
                configurable: originalDescriptor.configurable,
                enumerable: originalDescriptor.enumerable,
                get: originalDescriptor.get,
                set: mockFunction,
            });
        } else {
            Object.defineProperty(object, methodName, {
                configurable: originalDescriptor.configurable,
                enumerable: originalDescriptor.enumerable,
                value: mockFunction,
                writable: originalDescriptor.writable,
            });
        }

        this.#register(context);

        return mockFunction;
    }

    /**
     * Restores all mocks and disassociates them from this tracker.
     * After reset, existing mocks continue to function but are no longer managed by this instance.
     */
    reset() {
        this.restoreAll();
        this.#contexts.forEach(context => context.disassociateTracker());
        this.#contexts.length = 0;
    }

    /**
     * Restores original behavior for all mocks managed by this tracker.
     * Unlike reset(), contexts remain associated with this tracker.
     */
    restoreAll() {
        this.#contexts.forEach(context => context.restore());
    }
}
