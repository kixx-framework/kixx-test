import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import DescribeBlock from '../../lib/describe-block.js';
import { assertThrows } from '../helpers.js';

describe('DescribeBlock#before() and after()', ({ it }) => {
    it('creates a before block with correct name path', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.before(() => {});

        assertEqual(1, parent.beforeBlocks.length);
        assertEqual('parent', parent.beforeBlocks[0].namePath[0]);
        assertEqual('before[0]', parent.beforeBlocks[0].namePath[1]);
    });

    it('creates an after block with correct name path', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.after(() => {});

        assertEqual(1, parent.afterBlocks.length);
        assertEqual('parent', parent.afterBlocks[0].namePath[0]);
        assertEqual('after[0]', parent.afterBlocks[0].namePath[1]);
    });

    it('creates before/after blocks with inherited timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            timeout: 5000,
        });
        const testInterface = parent.createInterface();

        testInterface.before(() => {});
        testInterface.after(() => {});

        assertEqual(5000, parent.beforeBlocks[0].timeout);
        assertEqual(5000, parent.afterBlocks[0].timeout);
    });

    it('creates before/after blocks with custom timeout', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.before(() => {}, { timeout: 3000 });
        testInterface.after(() => {}, { timeout: 3000 });

        assertEqual(3000, parent.beforeBlocks[0].timeout);
        assertEqual(3000, parent.afterBlocks[0].timeout);
    });

    it('creates disabled before/after blocks when parent is disabled', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
            disabled: true,
        });
        const testInterface = parent.createInterface();

        testInterface.before(() => {});
        testInterface.after(() => {});

        assertEqual(true, parent.beforeBlocks[0].disabled);
        assertEqual(true, parent.afterBlocks[0].disabled);
    });

    it('increments before/after block indices', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        testInterface.before(() => {});
        testInterface.before(() => {});
        testInterface.after(() => {});
        testInterface.after(() => {});

        assertEqual('parent', parent.beforeBlocks[0].namePath[0]);
        assertEqual('before[0]', parent.beforeBlocks[0].namePath[1]);
        assertEqual('parent', parent.beforeBlocks[1].namePath[0]);
        assertEqual('before[1]', parent.beforeBlocks[1].namePath[1]);
        assertEqual('parent', parent.afterBlocks[0].namePath[0]);
        assertEqual('after[0]', parent.afterBlocks[0].namePath[1]);
        assertEqual('parent', parent.afterBlocks[1].namePath[0]);
        assertEqual('after[1]', parent.afterBlocks[1].namePath[1]);
    });

    it('throws error when before function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.before(null), 'First argument to before() must be a function');
        assertThrows(() => testInterface.before(undefined), 'First argument to before() must be a function');
        assertThrows(() => testInterface.before('not a function'), 'First argument to before() must be a function');
        assertThrows(() => testInterface.before(123), 'First argument to before() must be a function');
        assertThrows(() => testInterface.before({}), 'First argument to before() must be a function');
        assertThrows(() => testInterface.before([]), 'First argument to before() must be a function');
    });

    it('throws error when after function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.after(null), 'First argument to after() must be a function');
        assertThrows(() => testInterface.after(undefined), 'First argument to after() must be a function');
        assertThrows(() => testInterface.after('not a function'), 'First argument to after() must be a function');
        assertThrows(() => testInterface.after(123), 'First argument to after() must be a function');
        assertThrows(() => testInterface.after({}), 'First argument to after() must be a function');
        assertThrows(() => testInterface.after([]), 'First argument to after() must be a function');
    });
});
