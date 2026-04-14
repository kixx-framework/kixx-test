/**
 * @typedef {Object} CallContext
 * @property {Array} arguments - An array of the arguments passed to the mock function.
 * @property {*} error - If the mocked function threw then this property contains the thrown value. Default: undefined.
 * @property {*} result - The value returned by the mocked function.
 * @property {Function|undefined} target - If the mocked function is a constructor, this field contains the class being constructed. Otherwise this will be undefined.
 * @property {*} this - The mocked function's this value.
 */


export default class MockFunctionContext {

    /**
     * This function returns the number of times that this mock has been invoked.
     * @return {Number} The number of times that this mock has been invoked.
     */
    callCount() {
    }

    /**
     * Return the call context from the call at the index.
     * @param {Number} index - The index number of the call context to retrieve. Zero indexed.
     * @return {CallContext}
     */
    getCall(index) {
    }

    /**
     * This function is used to change the behavior of an existing mock.
     * @param {Function|AsyncFunction} implementation - The function to be used as the mock's new implementation.
     */
    mockImplementation(implementation) {
    }

    /**
     * This function is used to change the behavior of an existing mock for a single invocation. Once invocation onCall has occurred, the mock will revert to whatever behavior it would have used had mockImplementationOnce() not been called.
     * @param {Function|AsyncFunction} implementation - The function to be used as the mock's implementation for the invocation number specified by onCall.
     * @param {Number} onCall - The invocation number that will use implementation. If the specified invocation has already occurred then an exception is thrown. Default: The number of the next invocation.
     */
    mockImplementationOnce(implementation, onCall) {
    }

    /**
     * Resets the call history of the mock function.
     */
    resetCalls() {
    }

    /**
     * Resets the implementation of the mock function to its original behavior. The mock can still be used after calling this function.
     */
    restore() {
    }
}
