import { AssertionError } from '../deps.js';


let callOrder = 0;


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

export function spy(fn) {
    const invocations = [];
    const callback = typeof fn === 'function' ? fn : () => {};

    const invoke = (...args) => {
        const invocation = {
            args,
            order: callOrder,
        };
        callOrder += 1;
        invocations.push(invocation);

        return callback(...args);
    };
    const spyFunction = createSpyFunction(invoke, callback.length);

    Object.defineProperties(spyFunction, {
        callCount: {
            get: () => invocations.length,
        },
        args: {
            get: () => invocations.map((invocation) => invocation.args),
        },
        firstCall: {
            get: () => invocations[0],
        },
        secondCall: {
            get: () => invocations[1],
        },
    });

    spyFunction.calledBefore = (otherSpy) => {
        if (!spyFunction.firstCall || !otherSpy?.firstCall) {
            return false;
        }

        return spyFunction.firstCall.order < otherSpy.firstCall.order;
    };

    return spyFunction;
}

function createSpyFunction(invoke, arity) {
    switch (arity) {
        case 1:
            return function spyFunction(arg0) {
                return invoke(arg0);
            };
        case 2:
            return function spyFunction(arg0, arg1) {
                return invoke(arg0, arg1);
            };
        case 3:
            return function spyFunction(arg0, arg1, arg2) {
                return invoke(arg0, arg1, arg2);
            };
        default:
            return function spyFunction(...args) {
                return invoke(...args);
            };
    }
}
