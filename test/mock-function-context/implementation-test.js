import {
    AssertionError,
    assert,
    assertEqual,
} from '../../deps.js';
import { describe } from '../../mod.js';
import ProgrammerError from '../../lib/programmer-error.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockFunctionContext implementation controls', ({ it }) => {
    it('replaces behavior with mockImplementation()', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        assertEqual('original', fn());

        fn.mock.mockImplementation(() => 'replacement');

        assertEqual('replacement', fn());
        assertEqual(2, fn.mock.callCount());
        assertEqual('original', fn.mock.getCall(0).result);
        assertEqual('replacement', fn.mock.getCall(1).result);
    });

    it('uses mockImplementationOnce() for the next call only', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        fn.mock.mockImplementationOnce(() => 'once');

        assertEqual('once', fn());
        assertEqual('original', fn());
    });

    it('uses mockImplementationOnce() for a specific future call', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        fn.mock.mockImplementationOnce(() => 'third', 3);

        assertEqual('original', fn());
        assertEqual('original', fn());
        assertEqual('original', fn());
        assertEqual('third', fn());
        assertEqual('original', fn());
    });

    it('throws ProgrammerError for invalid one-off implementation inputs', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        fn();

        assertProgrammerError(
            () => fn.mock.mockImplementationOnce(null),
            'First argument to mockImplementationOnce() must be a function',
        );
        assertProgrammerError(
            () => fn.mock.mockImplementationOnce(() => {}, -1),
            'Second argument to mockImplementationOnce() must be a non-negative integer',
        );
        assertProgrammerError(
            () => fn.mock.mockImplementationOnce(() => {}, 0),
            'Second argument to mockImplementationOnce() cannot refer to a call that has already occurred',
        );
    });

    it('throws ProgrammerError for invalid mockImplementation() inputs', () => {
        const mock = new MockTracker();
        const fn = mock.fn(() => 'original');

        assertProgrammerError(
            () => fn.mock.mockImplementation(null),
            'First argument to mockImplementation() must be a function',
        );
    });

    it('restores the original implementation after times calls', () => {
        const mock = new MockTracker();
        const fn = mock.fn(
            () => 'original',
            () => 'implementation',
            { times: 2 },
        );

        assertEqual('implementation', fn());
        assertEqual('implementation', fn());
        assertEqual('original', fn());
        assertEqual(3, fn.mock.callCount());
    });
});

function assertProgrammerError(fn, message) {
    try {
        fn();
    } catch (error) {
        assert(error instanceof ProgrammerError);
        assert(error.message.includes(message));
        return;
    }

    throw new AssertionError('Expected to throw ProgrammerError', {}, assertProgrammerError);
}
