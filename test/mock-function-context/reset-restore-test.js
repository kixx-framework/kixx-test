import {
    assertEqual,
} from '../../deps.js';
import { describe } from '../../mod.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockFunctionContext reset and restore', ({ it }) => {
    it('clears call history without changing the active implementation', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        fn.mock.mockImplementation(() => 'replacement');
        fn();
        fn.mock.mockImplementationOnce(() => 'once');

        fn.mock.resetCalls();

        assertEqual(0, fn.mock.callCount());
        assertEqual('replacement', fn());
        assertEqual(1, fn.mock.callCount());
    });

    it('restores a fn mock to its original behavior and keeps recording', () => {
        const mock = new MockTracker();
        const fn = mock.fn(
            () => 'original',
            () => 'implementation',
        );

        assertEqual('implementation', fn());

        fn.mock.restore();

        assertEqual('original', fn());
        assertEqual(2, fn.mock.callCount());
        assertEqual('implementation', fn.mock.getCall(0).result);
        assertEqual('original', fn.mock.getCall(1).result);
    });
});
