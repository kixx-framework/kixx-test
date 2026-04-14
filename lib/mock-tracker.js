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

export default class MockTracker {
    #contexts = [];

    #register(context) {
        this.#contexts.push(context);
    }

    /**
     * Create a mock function with a .mock property which is a MockFunctionContext instance.
     * @param {Function|AsyncFunction} [original] - An optional function to create a mock on. Default: A no-op function.
     * @param {Function|AsyncFunction} [implementation] - An optional function used as the mock implementation for the original. This is useful for creating mocks that exhibit one behavior for a specified number of calls and then restore the behavior of original. Default: The function specified by original
     * @param {Object} [options] - Optional configuration options for the mock function.
     * @param {Number} [options.times=Infinity] - The number of times that the mock will use the behavior of implementation. Once the mock function has been called times times, it will automatically restore the behavior of original. This value must be an integer greater than zero. Default: Infinity
     * @return {Function} The mocked function which contains a special mock property, which is an instance of MockFunctionContext, and can be used for inspecting and changing the behavior of the mocked function.
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
     * Create a mock on an existing object method with a .mock property which is a MockFunctionContext instance.
     * @param {Object} object - The object whose method is being mocked.
     * @param {String|Symbol} methodName - The identifier of the method on object to mock. If object[methodName] is not a function, an error is thrown.
     * @param {Function|AsyncFunction} [implementation] - An optional function used as the mock implementation for the original. This is useful for creating mocks that exhibit one behavior for a specified number of calls and then restore the behavior of original. Default: The method specified by original
     * @param {Object} [options] - Optional configuration options for the mock function.
     * @param {Boolean} [getter=false] - If true, object[methodName] is treated as a getter. This option cannot be used with the setter option. Default: false.
     * @param {Boolean} [setter=false] - If true, object[methodName] is treated as a setter. This option cannot be used with the getter option. Default: false.
     * @param {Number} [options.times=Infinity] - The number of times that the mock will use the behavior of implementation. Once the mock function has been called times times, it will automatically restore the behavior of original. This value must be an integer greater than zero. Default: Infinity
     * @return {Function} The mocked method which contains a special mock property, which is an instance of MockFunctionContext, and can be used for inspecting and changing the behavior of the mocked function.
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
     * This function restores the default behavior of all mocks that were previously created by this MockTracker and disassociates the mocks from the MockTracker instance. Once disassociated, the mocks can still be used, but the MockTracker instance can no longer be used to reset their behavior or otherwise interact with them.
     */
    reset() {
        this.restoreAll();
        this.#contexts.forEach(context => context.disassociateTracker());
        this.#contexts.length = 0;
    }

    /**
     * This function restores the default behavior of all mocks that were previously created by this MockTracker. Unlike mock.reset(), mock.restoreAll() does not disassociate the mocks from the MockTracker instance.
     */
    restoreAll() {
        this.#contexts.forEach(context => context.restore());
    }
}
