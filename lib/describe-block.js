import { DEFAULT_TIMEOUT } from './constants.js';
import RunnableBlock from './runnable-block.js';
import ProgrammerError from './programmer-error.js';

/**
 * Represents a `describe()` scope containing hooks, tests, and nested describes.
 */
export default class DescribeBlock {
    namePath = [];
    disabled = false;
    timeout = DEFAULT_TIMEOUT;

    beforeBlocks = [];
    afterBlocks = [];
    testBlocks = [];
    childBlocks = [];

    /**
     * @param {Object} spec
     * @param {string[]} spec.namePath - Hierarchical path for this describe block.
     * @param {boolean} [spec.disabled=false] - Whether this block and descendants are disabled.
     * @param {number} [spec.timeout] - Default timeout applied to contained runnables.
     */
    constructor(spec) {
        this.namePath = spec.namePath;
        if (spec.disabled) {
            this.disabled = true;
        }
        if (Number.isInteger(spec.timeout)) {
            this.timeout = spec.timeout;
        }
    }

    /**
     * Returns this block's hierarchical name joined by delimiter.
     * @param {string} [delimiter=':']
     * @returns {string}
     */
    concatName(delimiter = ':') {
        return this.namePath.join(delimiter);
    }

    /**
     * Creates registration functions exposed to user test files.
     * @returns {Object}
     * @returns {Function} return.before
     * @returns {Function} return.after
     * @returns {Function} return.it
     * @returns {Function} return.describe
     * @returns {Function} return.xit
     * @returns {Function} return.xdescribe
     */
    createInterface() {
        return {
            before: this.createBeforeRegister(),
            after: this.createAfterRegister(),
            it: this.createTestRegister(),
            describe: this.createDescribeRegister(),
            xit: this.createDisabledTestRegister(),
            xdescribe: this.createDisabledDescribeRegister(),
        };
    }

    /**
     * Creates a `describe()` registration function scoped to this block.
     * @returns {Function}
     */
    createDescribeRegister() {
        const describe = (name, fn, opts = {}) => {
            if (!name || typeof name !== 'string') {
                throw new ProgrammerError('First argument to describe() must be a string', {}, describe);
            }

            let disabled = false;
            if (this.disabled || opts.disabled || typeof fn !== 'function') {
                disabled = true;
            }

            if (fn && typeof fn !== 'function') {
                throw new ProgrammerError('Second argument to describe() must be a function', {}, describe);
            }

            const timeout = Number.isInteger(opts.timeout) ? opts.timeout : this.timeout;

            const newBlock = new DescribeBlock({
                namePath: this.pushName(name),
                disabled,
                timeout,
            });

            this.childBlocks.push(newBlock);

            if (fn) {
                fn(newBlock.createInterface());
            }
        };

        return describe;
    }

    /**
     * Creates a `before()` registration function scoped to this block.
     * @returns {Function}
     */
    createBeforeRegister() {
        const before = (fn, opts = {}) => {
            if (typeof fn !== 'function') {
                throw new ProgrammerError('First argument to before() must be a function', {}, before);
            }

            const timeout = Number.isInteger(opts.timeout) ? opts.timeout : this.timeout;

            this.beforeBlocks.push(new RunnableBlock({
                type: 'before',
                namePath: this.pushName(`before[${ this.beforeBlocks.length }]`),
                fn,
                disabled: this.disabled,
                timeout,
            }));
        };

        return before;
    }

    /**
     * Creates an `after()` registration function scoped to this block.
     * @returns {Function}
     */
    createAfterRegister() {
        const after = (fn, opts = {}) => {
            if (typeof fn !== 'function') {
                throw new ProgrammerError('First argument to after() must be a function', {}, after);
            }

            const timeout = Number.isInteger(opts.timeout) ? opts.timeout : this.timeout;

            this.afterBlocks.push(new RunnableBlock({
                type: 'after',
                namePath: this.pushName(`after[${ this.afterBlocks.length }]`),
                fn,
                disabled: this.disabled,
                timeout,
            }));
        };

        return after;
    }

    /**
     * Creates an `it()` registration function scoped to this block.
     * @returns {Function}
     */
    createTestRegister() {
        const it = (name, fn, opts = {}) => {
            if (!name || typeof name !== 'string') {
                throw new ProgrammerError('First argument to it() must be a string', {}, it);
            }

            // If only a name argument is given, this block is considered to be disabled.
            const disabled = this.disabled ? true : typeof fn !== 'function';
            const timeout = Number.isInteger(opts.timeout) ? opts.timeout : this.timeout;

            if (fn && typeof fn !== 'function') {
                throw new ProgrammerError('Second argument to it() must be a function', {}, it);
            }

            this.testBlocks.push(new RunnableBlock({
                type: 'test',
                namePath: this.pushName(name),
                fn,
                disabled,
                timeout,
            }));
        };

        return it;
    }

    /**
     * Creates an `xit()` registration function scoped to this block.
     * @returns {Function}
     */
    createDisabledTestRegister() {
        const xit = (name, fn) => {
            if (!name || typeof name !== 'string') {
                throw new ProgrammerError('First argument to xit() must be a string', {}, xit);
            }

            if (fn && typeof fn !== 'function') {
                throw new ProgrammerError('Second argument to xit() must be a function', {}, xit);
            }

            this.testBlocks.push(new RunnableBlock({
                type: 'test',
                namePath: this.pushName(name),
                fn: null,
                disabled: true,
            }));
        };

        return xit;
    }

    /**
     * Creates an `xdescribe()` registration function scoped to this block.
     * @returns {Function}
     */
    createDisabledDescribeRegister() {
        const xdescribe = (name, fn, opts = {}) => {
            if (!name || typeof name !== 'string') {
                throw new ProgrammerError('First argument to xdescribe() must be a string', {}, xdescribe);
            }

            if (fn && typeof fn !== 'function') {
                throw new ProgrammerError('Second argument to xdescribe() must be a function', {}, xdescribe);
            }

            const timeout = Number.isInteger(opts.timeout) ? opts.timeout : this.timeout;

            const newBlock = new DescribeBlock({
                namePath: this.pushName(name),
                disabled: true,
                timeout,
            });

            this.childBlocks.push(newBlock);

            if (fn) {
                fn(newBlock.createInterface());
            }
        };

        return xdescribe;
    }

    /**
     * Returns a new name path with latestName appended.
     * @param {string} latestName
     * @returns {string[]}
     */
    pushName(latestName) {
        const namePath = this.namePath.slice();
        namePath.push(latestName);
        return namePath;
    }
}
