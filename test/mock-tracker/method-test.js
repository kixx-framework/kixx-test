import {
    AssertionError,
    assert,
    assertEqual,
} from '../../deps.js';
import { describe } from '../../mod.js';
import ProgrammerError from '../../lib/programmer-error.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockTracker#method()', ({ it }) => {
    it('mocks a regular object method and restores its descriptor', () => {
        const mock = new MockTracker();
        const object = { multiplier: 3 };
        function double(value) {
            // eslint-disable-next-line no-invalid-this
            return value * this.multiplier;
        }
        Object.defineProperty(object, 'double', {
            configurable: true,
            enumerable: false,
            value: double,
            writable: true,
        });
        const originalDescriptor = Object.getOwnPropertyDescriptor(object, 'double');

        const method = mock.method(object, 'double');

        assertEqual(method, object.double);
        assertEqual(12, object.double(4));
        assertEqual(1, method.mock.callCount());
        assertEqual(object, method.mock.getCall(0).this);

        method.mock.restore();

        const restoredDescriptor = Object.getOwnPropertyDescriptor(object, 'double');

        assertEqual(originalDescriptor.value, restoredDescriptor.value);
        assertEqual(originalDescriptor.configurable, restoredDescriptor.configurable);
        assertEqual(originalDescriptor.enumerable, restoredDescriptor.enumerable);
        assertEqual(originalDescriptor.writable, restoredDescriptor.writable);
        assertEqual(15, object.double(5));
    });

    it('mocks a getter and restores its descriptor', () => {
        const mock = new MockTracker();
        const object = {};
        function getValue() {
            return 10;
        }
        Object.defineProperty(object, 'value', {
            configurable: true,
            enumerable: true,
            get: getValue,
        });
        const originalDescriptor = Object.getOwnPropertyDescriptor(object, 'value');

        const getter = mock.method(object, 'value', () => 20, { getter: true });

        assertEqual(20, object.value);
        assertEqual(1, getter.mock.callCount());

        getter.mock.restore();

        const restoredDescriptor = Object.getOwnPropertyDescriptor(object, 'value');

        assertEqual(originalDescriptor.get, restoredDescriptor.get);
        assertEqual(originalDescriptor.set, restoredDescriptor.set);
        assertEqual(originalDescriptor.configurable, restoredDescriptor.configurable);
        assertEqual(originalDescriptor.enumerable, restoredDescriptor.enumerable);
        assertEqual(10, object.value);
    });

    it('mocks a setter and restores its descriptor', () => {
        const mock = new MockTracker();
        const object = {};
        let value = 0;
        function setValue(nextValue) {
            value = nextValue;
        }
        Object.defineProperty(object, 'value', {
            configurable: true,
            enumerable: true,
            set: setValue,
        });
        const originalDescriptor = Object.getOwnPropertyDescriptor(object, 'value');

        const setter = mock.method(object, 'value', (nextValue) => {
            value = nextValue * 2;
        }, { setter: true });

        object.value = 5;

        assertEqual(10, value);
        assertEqual(1, setter.mock.callCount());
        assertEqual(5, setter.mock.getCall(0).arguments[0]);

        setter.mock.restore();
        object.value = 7;

        const restoredDescriptor = Object.getOwnPropertyDescriptor(object, 'value');

        assertEqual(originalDescriptor.get, restoredDescriptor.get);
        assertEqual(originalDescriptor.set, restoredDescriptor.set);
        assertEqual(originalDescriptor.configurable, restoredDescriptor.configurable);
        assertEqual(originalDescriptor.enumerable, restoredDescriptor.enumerable);
        assertEqual(7, value);
    });

    it('rejects conflicting accessor options', () => {
        const mock = new MockTracker();
        const object = {
            get value() {
                return 1;
            },
        };

        assertProgrammerError(
            () => mock.method(object, 'value', undefined, { getter: true, setter: true }),
            'mock.method() cannot mock a getter and setter at the same time',
        );
    });

    it('rejects non-function regular method targets', () => {
        const mock = new MockTracker();

        assertProgrammerError(
            () => mock.method({ value: 1 }, 'value'),
            'The target property for mock.method() must be a function',
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
