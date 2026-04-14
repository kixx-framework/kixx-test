import { AssertionError } from 'kixx-assert';


export function assertThrows(fn, message) {
    try {
        fn();
    } catch (error) {
        if (!error.message.includes(message)) {
            throw new AssertionError(
                `Expected to throw an error with message "${ message }", but got "${ error.message }"`,
                {},
                assertThrows,
            );
        }
        return;
    }
    throw new AssertionError('Expected to throw an error', {}, assertThrows);
}
