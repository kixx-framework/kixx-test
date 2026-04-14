import { assertEqual, assertNumberNotNaN } from '../../deps.js';
import { describe } from '../../mod.js';
import RunnableBlock from '../../lib/runnable-block.js';
import { DEFAULT_TIMEOUT } from '../../lib/constants.js';

describe('RunnableBlock constructor', ({ it }) => {
    it('creates a block with default values', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'test' ],
            fn: () => {},
        });

        assertEqual('test', block.type);
        assertEqual('test', block.namePath[0]);
        assertEqual('function', typeof block.fn);
        assertEqual(false, block.disabled);
        assertNumberNotNaN(block.timeout);
        assertEqual(DEFAULT_TIMEOUT, block.timeout);
    });

    it('sets disabled flag when specified', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'test' ],
            fn: () => {},
            disabled: true,
        });

        assertEqual(true, block.disabled);
    });

    it('sets custom timeout when specified', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'test' ],
            fn: () => {},
            timeout: 5000,
        });

        assertEqual(5000, block.timeout);
    });

    it('creates blocks of different types', () => {
        const testBlock = new RunnableBlock({
            type: 'test',
            namePath: [ 'test' ],
            fn: () => {},
        });

        const beforeBlock = new RunnableBlock({
            type: 'before',
            namePath: [ 'before' ],
            fn: () => {},
        });

        const afterBlock = new RunnableBlock({
            type: 'after',
            namePath: [ 'after' ],
            fn: () => {},
        });

        assertEqual('test', testBlock.type);
        assertEqual('before', beforeBlock.type);
        assertEqual('after', afterBlock.type);
    });
});
