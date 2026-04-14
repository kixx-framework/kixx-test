import {
    assertEqual,
} from '../../deps.js';
import { describe } from '../../mod.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockTracker lifecycle', ({ it }) => {
    it('restores mixed fn and method mocks with restoreAll()', () => {
        const mock = new MockTracker();
        const fn = mock.fn(
            () => 'fn original',
            () => 'fn implementation',
        );
        const object = {
            method() {
                return 'method original';
            },
        };

        mock.method(object, 'method', () => 'method implementation');

        assertEqual('fn implementation', fn());
        assertEqual('method implementation', object.method());

        mock.restoreAll();

        assertEqual('fn original', fn());
        assertEqual('method original', object.method());

        fn.mock.mockImplementation(() => 'fn changed');
        mock.restoreAll();

        assertEqual('fn original', fn());
    });

    it('restores and disassociates mocks with reset()', () => {
        const mock = new MockTracker();
        const oldFn = mock.fn(
            () => 'old original',
            () => 'old implementation',
        );
        const object = {
            method() {
                return 'method original';
            },
        };

        mock.method(object, 'method', () => 'method implementation');

        assertEqual('old implementation', oldFn());
        assertEqual('method implementation', object.method());

        mock.reset();

        assertEqual('old original', oldFn());
        assertEqual('method original', object.method());

        oldFn.mock.mockImplementation(() => 'old changed');

        const newFn = mock.fn(
            () => 'new original',
            () => 'new implementation',
        );

        assertEqual('old changed', oldFn());
        assertEqual('new implementation', newFn());

        mock.restoreAll();

        assertEqual('old changed', oldFn());
        assertEqual('new original', newFn());
    });
});
