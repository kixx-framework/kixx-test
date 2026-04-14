import { assertEqual } from '../../deps.js';
import { describe } from '../../mod.js';
import RunnableBlock from '../../lib/runnable-block.js';

describe('RunnableBlock#concatName()', ({ it }) => {
    it('concatenates name path with default delimiter', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'parent', 'child', 'test' ],
            fn: () => {},
        });

        assertEqual('parent:child:test', block.concatName());
    });

    it('concatenates name path with custom delimiter', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'parent', 'child', 'test' ],
            fn: () => {},
        });

        assertEqual('parent/child/test', block.concatName('/'));
    });

    it('handles single name in path', () => {
        const block = new RunnableBlock({
            type: 'test',
            namePath: [ 'test' ],
            fn: () => {},
        });

        assertEqual('test', block.concatName());
    });
});
