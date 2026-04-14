We want to add a mocking utility to this test framework. It should be inspired by the Node.js test mock implementation documented at:

https://nodejs.org/docs/latest/api/test.html#mocking

We will only be implementing a subset of what Node.js implements, with some differences in our implementation.

Our desired implementation is specified as stubbed out JavaScript modules with JSDoc documentation:

- lib/mock-function-context.js
- lib/mock-tracker.js

A user would use the mocking capability like this:

```javascript
import { describe } from '../../mod.js';
import { assertEqual, assertUndefined } from '../../deps.js';
import MockTracker from '../../lib/mock-tracker.js';

describe('my module', ({ after, it }) => {
    const mock = new MockTracker();

    after(() => {
        // Reset the tracked mocks.
        mock.reset();
    });

    it('spies on a function', () => {
        const sum = mock.fn((a, b) => {
            return a + b;
        });

        assertEqual(0, sum.mock.callCount());
        assertEqual(7, sum(3, 4));
        assertEqual(1, sum.mock.callCount());

        const call = sum.mock.getCall(0);
        assertEqual(3, call.arguments[0]);
        assertEqual(4, call.arguments[1]);
        assertEqual(7, call.result);
        assertUndefined(call.error);
    });
});
```

<system>
After reviewing the user prompt above, create an implementation plan document.

If the user prompt does not have enough detail for you, you'll need to ask some questions to get more information from the user to fill in the gaps. Provide the user some options and alternative ideas with tradeoffs.

Think hard to imagine all the user stories which would encapsulate the user prompt above.

Review all user stories you can think of and then plan to implement them cohesively for your implementation plan document.

The plan should begin with a brief Implementation Approach section (3–5 sentences) summarizing the overall strategy and any cross-cutting concerns across the stories.

The rest of the document is a TODO list. Break each user story into discrete technical tasks — one task per file change, component, route, or logical unit of work. Each TODO item must follow this exact format:

```
- [ ] **<Short title>**
  - **Story**: <User story ID or title>
  - **What**: <What to build or change, in concrete terms>
  - **Where**: <File path(s) or module(s) to create or modify>
  - **Acceptance criteria**: <Which AC items this task satisfies>
  - **Depends on**: <Item titles this must come after, or "none">
```

Order items so that dependencies come first. Do not group items by story — sequence them by the order they should be implemented.

When completed, put the plan document in the plans/ directory.
</system>
