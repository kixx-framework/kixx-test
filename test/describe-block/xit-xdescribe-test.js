import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import DescribeBlock from '../../lib/describe-block.js';
import { assertThrows, spy } from '../helpers.js';


describe('DescribeBlock#xit() and DescribeBlock#xdescribe()', ({ it }) => {
    it('creates a disabled test block with xit', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        const fn = () => {};
        testInterface.xit('test case', fn);

        assertEqual(1, parent.testBlocks.length);
        assertEqual('parent', parent.testBlocks[0].namePath[0]);
        assertEqual('test case', parent.testBlocks[0].namePath[1]);
        assertEqual(true, parent.testBlocks[0].disabled);
        assertEqual(null, parent.testBlocks[0].fn);
    });

    it('creates a disabled describe block with xdescribe', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        const block = spy();
        testInterface.xdescribe('child', block);

        assertEqual(1, parent.childBlocks.length);
        assertEqual('parent', parent.childBlocks[0].namePath[0]);
        assertEqual('child', parent.childBlocks[0].namePath[1]);
        assertEqual(true, parent.childBlocks[0].disabled);

        assertEqual(1, block.callCount);
    });

    it('throws error when xit name is not a string', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.xit(null), 'First argument to xit() must be a string');
        assertThrows(() => testInterface.xit(undefined), 'First argument to xit() must be a string');
        assertThrows(() => testInterface.xit(123), 'First argument to xit() must be a string');
        assertThrows(() => testInterface.xit({}), 'First argument to xit() must be a string');
        assertThrows(() => testInterface.xit([]), 'First argument to xit() must be a string');
    });

    it('throws error when xit function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.xit('child', 'not a function'), 'Second argument to xit() must be a function');
        assertThrows(() => testInterface.xit('child', 123), 'Second argument to xit() must be a function');
        assertThrows(() => testInterface.xit('child', {}), 'Second argument to xit() must be a function');
        assertThrows(() => testInterface.xit('child', []), 'Second argument to xit() must be a function');
    });

    it('throws error when xdescribe name is not a string', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.xdescribe(null, () => {}), 'First argument to xdescribe() must be a string');
        assertThrows(() => testInterface.xdescribe(undefined, () => {}), 'First argument to xdescribe() must be a string');
        assertThrows(() => testInterface.xdescribe(123, () => {}), 'First argument to xdescribe() must be a string');
        assertThrows(() => testInterface.xdescribe({}, () => {}), 'First argument to xdescribe() must be a string');
        assertThrows(() => testInterface.xdescribe([], () => {}), 'First argument to xdescribe() must be a string');
    });

    it('throws error when xdescribe function is not a function', () => {
        const parent = new DescribeBlock({
            namePath: [ 'parent' ],
        });
        const testInterface = parent.createInterface();

        assertThrows(() => testInterface.xdescribe('child', 'not a function'), 'Second argument to xdescribe() must be a function');
        assertThrows(() => testInterface.xdescribe('child', 123), 'Second argument to xdescribe() must be a function');
        assertThrows(() => testInterface.xdescribe('child', {}), 'Second argument to xdescribe() must be a function');
        assertThrows(() => testInterface.xdescribe('child', []), 'Second argument to xdescribe() must be a function');
    });
});
