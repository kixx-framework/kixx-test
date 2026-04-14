/**
 * Error type used when the public API is called with invalid arguments.
 */
export default class ProgrammerError extends Error {
    /**
     * @param {string} message
     * @param {*} [data]
     * @param {Function} [sourceFunction]
     */
    constructor(message, data, sourceFunction) {
        super(message, data);

        Object.defineProperties(this, {
            /**
             * Error name used for diagnostics.
             * @name name
             * @type {string}
             */
            name: {
                enumerable: true,
                value: 'ProgrammerError',
            },
            /**
             * Stable machine-readable error code.
             * @name code
             * @type {string}
             */
            code: {
                enumerable: true,
                value: 'PROGRAMMER_ERROR',
            },
        });

        if (Error.captureStackTrace && sourceFunction) {
            Error.captureStackTrace(this, sourceFunction);
        }
    }
}
