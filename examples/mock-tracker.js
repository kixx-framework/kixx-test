import {
    describe,
    MockTracker,
} from '../mod.js';
import {
    assertEqual,
    assertUndefined,
} from '../deps.js';

describe('MockTracker example', ({ it }) => {
    it('creates a mock function and records calls', () => {
        const mock = new MockTracker();
        const add = mock.fn((a, b) => a + b);

        assertEqual(7, add(3, 4));
        assertEqual(1, add.mock.callCount());
        assertEqual(3, add.mock.getCall(0).arguments[0]);
        assertEqual(4, add.mock.getCall(0).arguments[1]);
        assertEqual(7, add.mock.getCall(0).result);
        assertUndefined(add.mock.getCall(0).error);
    });

    it('mocks an object method and restores it', () => {
        const mock = new MockTracker();
        const calculator = {
            multiply(a, b) {
                return a * b;
            },
        };

        mock.method(calculator, 'multiply', (a, b) => a * b * 10);

        assertEqual(120, calculator.multiply(3, 4));

        mock.restoreAll();

        assertEqual(12, calculator.multiply(3, 4));
    });
});
