/**
 * Lightweight event emitter used internally by the test runtime.
 * @emits EventEmitter#error - Emits when a listener throws while handling an event.
 */
export default class EventEmitter {

    #handlers = new Map();

    /**
     * Registers a listener for the given event.
     * @param {string} eventName - Event name to subscribe to.
     * @param {Function} handler - Listener function invoked with emitted payload.
     * @throws {Error} When eventName is not a string.
     * @throws {Error} When handler is not a function.
     */
    on(eventName, handler) {
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be a string');
        }
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }

        if (!this.#handlers.has(eventName)) {
            this.#handlers.set(eventName, new Set());
        }

        this.#handlers.get(eventName).add(handler);
    }

    /**
     * Removes a listener for the given event.
     * @param {string} eventName - Event name to unsubscribe from.
     * @param {Function} handler - Listener function to remove.
     * @throws {Error} When eventName is not a string.
     * @throws {Error} When handler is not a function.
     */
    off(eventName, handler) {
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be a string');
        }
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.#handlers.delete(eventName);
            }
        }
    }

    /**
     * Emits an event payload to all listeners registered for eventName.
     * If any listener throws, the thrown value is re-emitted through `error`.
     * @param {string} eventName - Event name to emit.
     * @param {*} event - Payload passed to listeners.
     * @throws {Error} When eventName is not a string.
     */
    emit(eventName, event) {
        if (typeof eventName !== 'string') {
            throw new Error('Event name must be a string');
        }

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                } catch (error) {
                    // If there's an error in a handler, emit it as an 'error' event
                    // but don't re-throw to allow other handlers to run
                    this.emit('error', error);
                }
            }
        }
    }
}
