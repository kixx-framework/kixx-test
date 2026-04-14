import {
    AssertionError,
    assert,
    assertEqual,
    assertUndefined,
} from '../../deps.js';
import { describe } from '../../mod.js';
import ProgrammerError from '../../lib/programmer-error.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockTracker#fn()', ({ it }) => {
    it('creates a mock function which records calls', () => {
        const mock = new MockTracker();
        const scope = { offset: 10 };
        const sum = mock.fn(function sum(a, b) {
            // eslint-disable-next-line no-invalid-this
            return this.offset + a + b;
        });

        const result = sum.call(scope, 3, 4);
        const call = sum.mock.getCall(0);

        assertEqual(2, sum.length);
        assertEqual(17, result);
        assertEqual(1, sum.mock.callCount());
        assertEqual(3, call.arguments[0]);
        assertEqual(4, call.arguments[1]);
        assertEqual(17, call.result);
        assertUndefined(call.error);
        assertUndefined(call.target);
        assertEqual(scope, call.this);
        assertEqual(false, Object.keys(sum).includes('mock'));
    });

    it('creates a no-op mock function by default', () => {
        const mock = new MockTracker();
        const fn = mock.fn();

        assertUndefined(fn('a'));
        assertEqual(1, fn.mock.callCount());
        assertEqual('a', fn.mock.getCall(0).arguments[0]);
        assertUndefined(fn.mock.getCall(0).result);
    });

    it('uses an implementation when provided', () => {
        const mock = new MockTracker();
        const sum = mock.fn(
            (a, b) => a + b,
            (a, b) => a * b,
        );

        assertEqual(12, sum(3, 4));
        assertEqual(12, sum.mock.getCall(0).result);
    });

    it('throws ProgrammerError for invalid arguments', () => {
        const mock = new MockTracker();

        assertProgrammerError(
            () => mock.fn(null),
            'First argument to mock.fn() must be a function',
        );
        assertProgrammerError(
            () => mock.fn(undefined, null),
            'Second argument to mock.fn() must be a function',
        );
        assertProgrammerError(
            () => mock.fn(undefined, undefined, { times: 0 }),
            'options.times for mock.fn() must be an integer greater than zero',
        );
        assertProgrammerError(
            () => mock.fn(undefined, undefined, { times: 1.5 }),
            'options.times for mock.fn() must be an integer greater than zero',
        );
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
