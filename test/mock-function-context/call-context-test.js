import {
    assertEqual,
    assertUndefined,
} from '../../deps.js';
import { describe } from '../../mod.js';
import { assertThrows } from '../helpers.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('MockFunctionContext CallContext capture', ({ it }) => {
    it('records thrown errors and rethrows them', () => {
        const mock = new MockTracker();
        const error = new Error('Boom');
        const fn = mock.fn(() => {
            throw error;
        });

        assertThrows(() => fn('value'), 'Boom');

        const call = fn.mock.getCall(0);

        assertEqual(1, fn.mock.callCount());
        assertEqual('value', call.arguments[0]);
        assertEqual(error, call.error);
        assertUndefined(call.result);
    });

    it('records the this value from call and apply', () => {
        const mock = new MockTracker();
        const firstScope = { prefix: 'hello' };
        const secondScope = { prefix: 'goodbye' };
        const fn = mock.fn(function join(value) {
            // eslint-disable-next-line no-invalid-this
            return `${ this.prefix } ${ value }`;
        });

        assertEqual('hello world', fn.call(firstScope, 'world'));
        assertEqual('goodbye moon', fn.apply(secondScope, [ 'moon' ]));

        assertEqual(firstScope, fn.mock.getCall(0).this);
        assertEqual(secondScope, fn.mock.getCall(1).this);
    });

    it('records the constructor target when invoked with new', () => {
        const mock = new MockTracker();
        const Widget = mock.fn(function Widget(name) {
            // eslint-disable-next-line no-invalid-this
            this.name = name;
        });

        const widget = new Widget('box');
        const call = Widget.mock.getCall(0);

        assertEqual('box', widget.name);
        assertEqual(Widget, call.target);
        assertEqual('box', call.arguments[0]);
        assertUndefined(call.error);
    });
});
