import { assert, assertEqual, assertNumberNotNaN } from '../../deps.js';
import { describe } from '../../mod.js';
import DescribeBlock from '../../lib/describe-block.js';
import { DEFAULT_TIMEOUT } from '../../lib/constants.js';

describe('DescribeBlock constructor', ({ it }) => {
    it('creates a block with default values', () => {
        const block = new DescribeBlock({
            namePath: [ 'test' ],
        });

        assertEqual('test', block.namePath[0]);
        assertEqual(false, block.disabled);
        assertNumberNotNaN(block.timeout);
        assertEqual(DEFAULT_TIMEOUT, block.timeout);
        assert(Array.isArray(block.beforeBlocks));
        assertEqual(0, block.beforeBlocks.length);
        assert(Array.isArray(block.afterBlocks));
        assertEqual(0, block.afterBlocks.length);
        assert(Array.isArray(block.testBlocks));
        assertEqual(0, block.testBlocks.length);
        assert(Array.isArray(block.childBlocks));
        assertEqual(0, block.childBlocks.length);
    });

    it('sets disabled flag when specified', () => {
        const block = new DescribeBlock({
            namePath: [ 'test' ],
            disabled: true,
        });

        assertEqual(true, block.disabled);
    });

    it('sets custom timeout when specified', () => {
        const block = new DescribeBlock({
            namePath: [ 'test' ],
            timeout: 5000,
        });

        assertEqual(5000, block.timeout);
    });
});
