export default class MockTracker {

    /**
     * Create a mock function with a .mock property which is a MockFunctionContext instance.
     * @param {Function|AsyncFunction} [original] - An optional function to create a mock on. Default: A no-op function.
     * @param {Function|AsyncFunction} [implementation] - An optional function used as the mock implementation for the original. This is useful for creating mocks that exhibit one behavior for a specified number of calls and then restore the behavior of original. Default: The function specified by original
     * @param {Object} [options] - Optional configuration options for the mock function.
     * @param {Number} [options.times=Infinity] - The number of times that the mock will use the behavior of implementation. Once the mock function has been called times times, it will automatically restore the behavior of original. This value must be an integer greater than zero. Default: Infinity
     * @return {Function} The mocked function which contains a special mock property, which is an instance of MockFunctionContext, and can be used for inspecting and changing the behavior of the mocked function.
     */
    fn(original, implementation, options) {
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
    }

    /**
     * This function restores the default behavior of all mocks that were previously created by this MockTracker and disassociates the mocks from the MockTracker instance. Once disassociated, the mocks can still be used, but the MockTracker instance can no longer be used to reset their behavior or otherwise interact with them.
     */
    reset() {
    }

    /**
     * This function restores the default behavior of all mocks that were previously created by this MockTracker. Unlike mock.reset(), mock.restoreAll() does not disassociate the mocks from the MockTracker instance.
     */
    restoreAll() {
    }
}
