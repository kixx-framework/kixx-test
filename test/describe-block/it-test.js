import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import DescribeBlock from '../../lib/describe-block.js';
import { assertThrows } from '../helpers.js';

describe('DescribeBlock#it()', ({ it }) => {
    it('creates a test block with correct name path', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.it('test case', () => {});

        assertEqual(1, parent.testBlocks.length);
        assertEqual('parent', parent.testBlocks[0].namePath[0]);
        assertEqual('test case', parent.testBlocks[0].namePath[1]);
    });

    it('creates a test block with inherited timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            timeout: 5000,
        });
        const testInterface = parent.createInterface();

        testInterface.it('test case', () => {});

        assertEqual(5000, parent.testBlocks[0].timeout);
    });

    it('creates a test block with custom timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.it('test case', () => {}, { timeout: 3000 });

        assertEqual(3000, parent.testBlocks[0].timeout);
    });

    it('creates a disabled test block when parent is disabled', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            disabled: true,
        });
        const testInterface = parent.createInterface();

        testInterface.it('test case', () => {});

        assertEqual(true, parent.testBlocks[0].disabled);
    });

    it('creates a disabled test block when no function is provided', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.it('test case');

        assertEqual(true, parent.testBlocks[0].disabled);
    });

    it('throws error when name is not a string', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.it(null, () => {}), 'First argument to it() must be a string');
        assertThrows(() => testInterface.it(undefined, () => {}), 'First argument to it() must be a string');
        assertThrows(() => testInterface.it(123, () => {}), 'First argument to it() must be a string');
        assertThrows(() => testInterface.it({}, () => {}), 'First argument to it() must be a string');
        assertThrows(() => testInterface.it([], () => {}), 'First argument to it() must be a string');
    });

    it('throws error when function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.it('test case', 'not a function'), 'Second argument to it() must be a function');
        assertThrows(() => testInterface.it('test case', 123), 'Second argument to it() must be a function');
        assertThrows(() => testInterface.it('test case', {}), 'Second argument to it() must be a function');
        assertThrows(() => testInterface.it('test case', []), 'Second argument to it() must be a function');
    });
});
