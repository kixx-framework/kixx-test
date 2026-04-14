Kixx Test
=========
A lightweight framework for writing automated tests in JavaScript environments.

## Environment Support

| Env     | Version    |
|---------|------------|
| ECMA    | >= ES2022  |
| Node.js | >= 16.13.2 |
| Deno    | >= 1.0.0   |

## Getting Started

### 1. Write a test file

Use `describe()` to define a suite and `it()` to define tests.

```javascript
import { describe } from 'kixx-test';
import { assertEqual } from 'kixx-assert';

describe('Math', ({ it }) => {
    it('adds numbers', () => {
        assertEqual(7, 3 + 4);
    });
});
```

### 2. Use async tests when needed

Test functions can return promises (for `async`/`await`) or use a callback.

```javascript
import { describe } from 'kixx-test';
import { assertEqual } from 'kixx-assert';

describe('Async Example', ({ it }) => {
    it('supports promises', async () => {
        const result = await Promise.resolve('ok');
        assertEqual('ok', result);
    });

    it('supports callback-style async tests', (done) => {
        setTimeout(() => {
            assertEqual(2, 1 + 1);
            done();
        }, 10);
    }, { timeout: 100 });
});
```

### 3. Organize with nested suites and hooks

Inside a `describe()` callback, you can use:

- `before(fn, opts?)`
- `after(fn, opts?)`
- `it(name, fn, opts?)`
- `describe(name, fn, opts?)`
- `xit(name, fn?)` to skip a test
- `xdescribe(name, fn, opts?)` to skip a suite

```javascript
import { describe } from 'kixx-test';
import { assertEqual } from 'kixx-assert';

describe('Counter', ({ before, it, describe, xit }) => {
    let value;

    before(() => {
        value = 0;
    });

    describe('increment', ({ it }) => {
        it('increments by 1', () => {
            value += 1;
            assertEqual(1, value);
        });
    });

    xit('this test is skipped', () => {
        assertEqual(true, false);
    });
});
```

### 4. Run your tests

This package provides `runTests()` which returns an event emitter.
The script in `test/run-tests.js` is a full reference implementation.

```javascript
import { runTests } from 'kixx-test';

const emitter = runTests();

emitter.on('blockComplete', ({ block, error }) => {
    if (error) {
        console.error(`Failed: ${ block.concatName(' - ') }`);
        console.error(error);
    }
});

emitter.on('complete', () => {
    console.log('Done');
});
```

## Examples

See the runnable examples in [`examples/`](./examples):

- `examples/basic-test.js`
- `examples/async-tests.js`
- `examples/nested-tests.js`
- `examples/disabled-tests.js`
- `examples/mock-tracker.js`

There is also a full runner example in [`test/run-tests.js`](./test/run-tests.js).

Copyright and License
---------------------
Copyright: (c) 2017 - 2026 by Kris Walker (www.kriswalker.me)

Unless otherwise indicated, all source code is licensed under the MIT license. See LICENSE for details.
