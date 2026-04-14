import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import EventEmitter from '../../lib/event-emitter.js';
import { assertThrows, spy } from '../helpers.js';


describe('EventEmitter#off()', ({ it }) => {
    it('removes a single handler registration', () => {
        const emitter = new EventEmitter();
        const handlerSpy = spy();
        const eventObj = { test: 'test' };

        emitter.on('test', handlerSpy);
        emitter.emit('test', eventObj);
        emitter.off('test', handlerSpy);
        emitter.emit('test', eventObj);

        assertEqual(1, handlerSpy.callCount);
    });

    it('removes all registrations of the same handler', () => {
        const emitter = new EventEmitter();
        const handlerSpy = spy();
        const eventObj = { test: 'test' };

        emitter.on('test', handlerSpy);
        emitter.on('test', handlerSpy);
        emitter.emit('test', eventObj);
        emitter.off('test', handlerSpy);
        emitter.emit('test', eventObj);

        assertEqual(1, handlerSpy.callCount);
    });

    it('removes only the specified handler', () => {
        const emitter = new EventEmitter();
        const spy1 = spy();
        const spy2 = spy();
        const eventObj = { test: 'test' };

        emitter.on('test', spy1);
        emitter.on('test', spy2);
        emitter.emit('test', eventObj);
        emitter.off('test', spy1);
        emitter.emit('test', eventObj);

        assertEqual(1, spy1.callCount);
        assertEqual(2, spy2.callCount);
        assertEqual(eventObj, spy2.firstCall.args[0]);
        assertEqual(eventObj, spy2.secondCall.args[0]);
    });

    it('removes the event entry when no handlers remain', () => {
        const emitter = new EventEmitter();
        const handlerSpy = spy();
        const spy2 = spy();
        const eventObj = { test: 'test' };

        emitter.on('test', handlerSpy);
        emitter.emit('test', eventObj);
        emitter.off('test', handlerSpy);
        emitter.emit('test', eventObj);

        assertEqual(1, handlerSpy.callCount);
        emitter.on('test', spy2);
        emitter.emit('test', eventObj);
        assertEqual(1, handlerSpy.callCount);
        assertEqual(1, spy2.callCount);
        assertEqual(eventObj, handlerSpy.firstCall.args[0]);
        assertEqual(eventObj, spy2.firstCall.args[0]);
    });

    it('does nothing if the event has no handlers', () => {
        const emitter = new EventEmitter();
        const handlerSpy = spy();

        emitter.off('test', handlerSpy);
        emitter.emit('test', { test: 'test' });

        assertEqual(0, handlerSpy.callCount);
    });

    it('does nothing if the handler is not registered', () => {
        const emitter = new EventEmitter();
        const spy1 = spy();
        const spy2 = spy();
        const eventObj = { test: 'test' };

        emitter.on('test', spy1);
        emitter.off('test', spy2);
        emitter.emit('test', eventObj);

        assertEqual(1, spy1.callCount);
        assertEqual(0, spy2.callCount);
        assertEqual(eventObj, spy1.firstCall.args[0]);
    });

    it('throws an error if eventName is not a string', () => {
        const emitter = new EventEmitter();
        const handler = spy();

        assertThrows(() => emitter.off(null, handler), 'Event name must be a string');
        assertThrows(() => emitter.off(undefined, handler), 'Event name must be a string');
        assertThrows(() => emitter.off(123, handler), 'Event name must be a string');
        assertThrows(() => emitter.off({}, handler), 'Event name must be a string');
        assertThrows(() => emitter.off([], handler), 'Event name must be a string');
    });

    it('throws an error if handler is not a function', () => {
        const emitter = new EventEmitter();

        assertThrows(() => emitter.off('test', null), 'Handler must be a function');
        assertThrows(() => emitter.off('test', undefined), 'Handler must be a function');
        assertThrows(() => emitter.off('test', 'not a function'), 'Handler must be a function');
        assertThrows(() => emitter.off('test', 123), 'Handler must be a function');
        assertThrows(() => emitter.off('test', {}), 'Handler must be a function');
        assertThrows(() => emitter.off('test', []), 'Handler must be a function');
    });
});
