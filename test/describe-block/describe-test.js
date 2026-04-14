import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import DescribeBlock from '../../lib/describe-block.js';
import { assertThrows } from '../helpers.js';

describe('DescribeBlock#describe()', ({ it }) => {
    it('creates a child block with correct name path', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child', () => {});

        assertEqual(1, parent.childBlocks.length);
        assertEqual('parent', parent.childBlocks[0].namePath[0]);
        assertEqual('child', parent.childBlocks[0].namePath[1]);
    });

    it('creates a child block with inherited timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            timeout: 5000,
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child', () => {});

        assertEqual(5000, parent.childBlocks[0].timeout);
    });

    it('creates a child block with custom timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child', () => {}, { timeout: 3000 });

        assertEqual(3000, parent.childBlocks[0].timeout);
    });

    it('creates a disabled child block when parent is disabled', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            disabled: true,
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child', () => {});

        assertEqual(true, parent.childBlocks[0].disabled);
    });

    it('creates a disabled child block when disabled option is true', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child', () => {}, { disabled: true });

        assertEqual(true, parent.childBlocks[0].disabled);
    });

    it('creates a disabled child block when no function is provided', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.describe('child');

        assertEqual(true, parent.childBlocks[0].disabled);
    });

    it('throws error when name is not a string', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.describe(null, () => {}), 'First argument to describe() must be a string');
        assertThrows(() => testInterface.describe(undefined, () => {}), 'First argument to describe() must be a string');
        assertThrows(() => testInterface.describe(123, () => {}), 'First argument to describe() must be a string');
        assertThrows(() => testInterface.describe({}, () => {}), 'First argument to describe() must be a string');
        assertThrows(() => testInterface.describe([], () => {}), 'First argument to describe() must be a string');
    });

    it('throws error when function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.describe('child', 'not a function'), 'Second argument to describe() must be a function');
        assertThrows(() => testInterface.describe('child', 123), 'Second argument to describe() must be a function');
        assertThrows(() => testInterface.describe('child', {}), 'Second argument to describe() must be a function');
        assertThrows(() => testInterface.describe('child', []), 'Second argument to describe() must be a function');
    });
});
