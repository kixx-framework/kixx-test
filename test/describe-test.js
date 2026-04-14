import { assertEqual } from '../deps.js';
import { describe, _rootBlocks } from '../mod.js';
import { assertThrows, spy } from './helpers.js';

import { DEFAULT_TIMEOUT } from '../lib/constants.js';


describe('describe() function', (block) => {
    block.describe('with invalid name parameter', ({ it }) => {
        it('should throw error when name is not a string', () => {
            assertThrows(() => describe(123), 'First argument to describe() must be a string');
            assertThrows(() => describe({}), 'First argument to describe() must be a string');
            assertThrows(() => describe([]), 'First argument to describe() must be a string');
        });
    });

    block.describe('with invalid function parameter', ({ it }) => {
        it('should throw error when fn is not a function', () => {
            assertThrows(() => describe('test', 123), 'Second argument to describe() must be a function');
            assertThrows(() => describe('test', {}), 'Second argument to describe() must be a function');
            assertThrows(() => describe('test', []), 'Second argument to describe() must be a function');
        });
    });

    block.describe('with only a name parameter', ({ it }) => {
        it('should create a disabled block', () => {
            describe('test');
            assertEqual(true, _rootBlocks[_rootBlocks.length - 1].disabled);
        });
    });

    block.describe('with the disabled options set to true', ({ it }) => {
        it('should create a disabled block', () => {
            describe('test', () => {}, { disabled: true });
            assertEqual(true, _rootBlocks[_rootBlocks.length - 1].disabled);
        });
    });

    block.describe('when a custom timeout is provided', ({ it }) => {
        it('should create a block with the custom timeout', () => {
            describe('test', () => {}, { timeout: 5000 });
            assertEqual(5000, _rootBlocks[_rootBlocks.length - 1].timeout);
        });
    });

    block.describe('with valid parameters', ({ it }) => {
        it('should create a block with default timeout', () => {
            describe('test', () => {});
            assertEqual(DEFAULT_TIMEOUT, _rootBlocks[_rootBlocks.length - 1].timeout);
        });
        it('calls the provide block function', () => {
            const fn = spy();
            describe('test', fn);
            assertEqual(1, fn.callCount);
        });
    });
});
