# Mocking Utility Implementation Plan

## Implementation Approach

Build `MockTracker` and `MockFunctionContext` as cooperating classes that produce wrapper functions carrying a `.mock` property. `MockFunctionContext` owns all per-mock state (call records, active implementation, original behavior, optional `times` budget) using ES6 private fields; the wrapper function is a small closure that delegates every invocation to a single internal `invoke` method so that sync returns, thrown errors, `this`, and `new.target` are all captured on one code path. `MockTracker.fn()` constructs a fresh context plus a wrapper; `MockTracker.method()` reuses `fn()` internally and additionally remembers how to reattach the original descriptor to the object (including `getter`/`setter` accessors) so `restore()` can undo the patch. The tracker keeps a private list of contexts it created so `restoreAll()` and `reset()` can fan out; `reset()` additionally clears the list so later tracker operations no longer touch disassociated mocks. Cross-cutting concerns: all public entry points validate arguments and throw `ProgrammerError` with `sourceFunction` set for clean stack traces; call records are immutable snapshots (plain objects frozen at capture time) so consumers of `getCall()` cannot corrupt history; tests live under `test/mock-function-context/` and `test/mock-tracker/` mirroring the existing `test/describe-block/` convention and are discovered automatically by `test/run-tests.js` via its `test.js$` regex.

## TODO

- [x] **Scaffold MockFunctionContext private state**
  - **Story**: Basic spy / call capture
  - **What**: Add private fields to `MockFunctionContext` for call records array, current implementation, original function, one-off implementation map (keyed by call index), `times` budget, owning tracker reference, and a restore callback. Accept these via a constructor (not part of the public JSDoc — internal only). Leave public methods as stubs to be filled in later tasks.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: Class can be instantiated from `MockTracker` with all collaborators injected; no public API change visible to users.
  - **Depends on**: none

- [x] **Scaffold MockTracker private registry**
  - **Story**: Tracker lifecycle (reset/restoreAll)
  - **What**: Add a private `#contexts` array to `MockTracker` plus a private `#register(context)` helper. Leave `fn`, `method`, `reset`, `restoreAll` as stubs.
  - **Where**: `lib/mock-tracker.js`
  - **Acceptance criteria**: `new MockTracker()` works; internal registry is isolated per instance.
  - **Depends on**: none

- [x] **Implement central invoke path on MockFunctionContext**
  - **Story**: Basic spy / call capture; Error capture; `this` & constructor capture
  - **What**: Add a private `#invoke(thisArg, args, newTarget)` that: (1) picks the implementation for this call (one-off map > current implementation > original > no-op), (2) runs it via `Reflect.apply` or `Reflect.construct` based on `newTarget`, (3) records a frozen `CallContext` with `arguments`, `result`, `error`, `target`, `this`, (4) decrements `times` budget and auto-restores when exhausted. Errors still propagate to the caller after being recorded.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: Wrapping a throwing function records `call.error` and rethrows; wrapping with `new` sets `call.target` to the constructor; `this` is preserved.
  - **Depends on**: Scaffold MockFunctionContext private state

- [x] **Implement MockTracker.fn()**
  - **Story**: Basic spy; `times` option
  - **What**: Build a wrapper function that forwards all calls (including `new`) to `context.#invoke`. Default `original` is a no-op; default `implementation` is `original`. Attach `.mock` (the `MockFunctionContext`) as a non-enumerable property. Register the context with the tracker. Validate `original`/`implementation` are functions when provided and `options.times` is a positive integer when provided; throw `ProgrammerError` otherwise.
  - **Where**: `lib/mock-tracker.js`, `lib/mock-function-context.js`
  - **Acceptance criteria**: `mock.fn((a,b) => a+b)` returns a callable with `.mock` property; `sum(3,4)` returns `7`; arity and identity behave as expected; invalid inputs throw `ProgrammerError`.
  - **Depends on**: Implement central invoke path on MockFunctionContext, Scaffold MockTracker private registry

- [x] **Implement callCount() and getCall()**
  - **Story**: Inspecting calls
  - **What**: Return the count of recorded calls and the frozen `CallContext` at the given index. Return `undefined` for out-of-range indices (matching Node behavior).
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: Matches example in task prompt: `sum.mock.callCount()` grows per invocation; `sum.mock.getCall(0).arguments[0] === 3`; `call.result === 7`; `call.error === undefined`.
  - **Depends on**: Implement central invoke path on MockFunctionContext

- [x] **Implement mockImplementation()**
  - **Story**: Swap behavior at runtime
  - **What**: Replace the "current implementation" slot on the context. Validate argument is a function; throw `ProgrammerError` otherwise. Does not clear call history or the one-off map.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: After `.mockImplementation(fn)`, subsequent calls route to `fn`; earlier recorded calls are preserved.
  - **Depends on**: Implement MockTracker.fn()

- [x] **Implement mockImplementationOnce()**
  - **Story**: One-off behavior override
  - **What**: Store the implementation in a Map keyed by call index. Default key is `callCount()` (next invocation). If `onCall` is less than current `callCount()`, throw `ProgrammerError`. Validate `implementation` is a function and `onCall` is a non-negative integer if provided.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: `.mockImplementationOnce(impl)` applies to exactly one call then reverts; `.mockImplementationOnce(impl, 3)` applies only to the 4th call; past indices throw.
  - **Depends on**: Implement mockImplementation()

- [x] **Wire `times` option auto-restore**
  - **Story**: `times` option
  - **What**: In `#invoke`, after a call completes, if `times` was set and call count reaches `times`, automatically call the restore-to-original path (same one `restore()` uses). Subsequent calls still record, but they run the original function.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: `mock.fn(orig, impl, { times: 2 })` runs `impl` for the first two calls and `orig` from the third onward; call records continue to accumulate across the transition.
  - **Depends on**: Implement MockTracker.fn()

- [x] **Implement resetCalls()**
  - **Story**: Clear call history
  - **What**: Empty the call records array and clear the one-off implementation map. Does not change the active implementation and does not disassociate from the tracker.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: After `resetCalls()`, `callCount()` is `0`; next invocation uses the currently active implementation.
  - **Depends on**: Implement callCount() and getCall()

- [x] **Implement restore() for fn mocks**
  - **Story**: Restore original behavior
  - **What**: Invoke the stored restore callback set during construction. For `fn()`-created mocks, this resets the current implementation to the original (no object mutation required). Safe to call multiple times.
  - **Where**: `lib/mock-function-context.js`
  - **Acceptance criteria**: After `.mock.restore()` on a `fn()` mock, calls run the original function but `.mock` still records them.
  - **Depends on**: Implement mockImplementation()

- [x] **Implement MockTracker.method() for regular methods**
  - **Story**: Spy on object methods
  - **What**: Validate `object` is an object and `object[methodName]` is a function (when neither `getter` nor `setter` is set). Build a mock via the same internals as `fn()`; replace `object[methodName]` with the wrapper using `Object.defineProperty` preserving writable/enumerable/configurable where sensible; set the restore callback to reinstall the original property descriptor. Throw `ProgrammerError` if both `getter` and `setter` are true, or if the target isn't a function.
  - **Where**: `lib/mock-tracker.js`
  - **Acceptance criteria**: `mock.method(obj, 'foo')` replaces `obj.foo` with a spy; calling `obj.foo(...)` records calls and preserves `this`; `.mock.restore()` puts the original back on `obj` with its original descriptor flags.
  - **Depends on**: Implement MockTracker.fn(), Implement restore() for fn mocks

- [x] **Extend method() with getter/setter support**
  - **Story**: Mock property accessors
  - **What**: When `options.getter` is true, read the existing descriptor's getter, build the mock wrapper from it, and reinstall a descriptor whose `get` is the wrapper. Same shape for `setter` using the descriptor's setter. Error if the target accessor is missing. Restore reinstalls the original descriptor.
  - **Where**: `lib/mock-tracker.js`
  - **Acceptance criteria**: `mock.method(obj, 'x', impl, { getter: true })` causes reading `obj.x` to invoke the mock and record the call; restore returns the original accessor behavior.
  - **Depends on**: Implement MockTracker.method() for regular methods

- [x] **Implement MockTracker.restoreAll()**
  - **Story**: Tracker-wide restore
  - **What**: Iterate the registry and call `restore()` on each context. Do not empty the registry (so subsequent `restoreAll()` or `reset()` still sees them).
  - **Where**: `lib/mock-tracker.js`
  - **Acceptance criteria**: Multiple mocks (fn + method mixed) all revert in one call; tracker can still be used afterward.
  - **Depends on**: Implement restore() for fn mocks, Implement MockTracker.method() for regular methods

- [x] **Implement MockTracker.reset()**
  - **Story**: Tracker reset (as used by `after()` in the example)
  - **What**: Call `restoreAll()` and then clear the registry and null out the tracker reference on each context so subsequent tracker operations ignore them. Mocks remain callable and their `.mock` API still works on any prior snapshots.
  - **Where**: `lib/mock-tracker.js`, `lib/mock-function-context.js`
  - **Acceptance criteria**: Matches the `after(() => mock.reset())` pattern in the task example; calling `.mock` methods on a disassociated mock still works locally; creating new mocks after `reset()` and calling `restoreAll()` does not touch the old ones.
  - **Depends on**: Implement MockTracker.restoreAll()

- [x] **Export MockTracker from the public entry**
  - **Story**: Public API surface
  - **What**: Re-export `MockTracker` from `mod.js` so consumers can `import { MockTracker } from 'kixx-test'`. Keep the existing direct import path (`lib/mock-tracker.js`) working — it already does.
  - **Where**: `mod.js`
  - **Acceptance criteria**: Both import styles resolve to the same class.
  - **Depends on**: Implement MockTracker.reset()

- [x] **Tests: MockTracker.fn() basics and validation**
  - **Story**: Basic spy; argument validation
  - **What**: Tests mirroring the example: spy on a function, confirm call count, arguments, result, `this`, no error. Add cases for no-op default (`mock.fn()`), invalid `original`/`implementation`/`times` throwing `ProgrammerError`.
  - **Where**: `test/mock-tracker/fn-test.js`
  - **Acceptance criteria**: The exact example from the task prompt passes; invalid inputs throw with appropriate messages.
  - **Depends on**: Implement MockTracker.fn()

- [x] **Tests: CallContext capture (error, this, constructor)**
  - **Story**: Error capture; `this`/`target` capture
  - **What**: Cover a mock that throws (rethrows and records `call.error`), a mock invoked via `.call`/`.apply` (records `this`), and a mock invoked with `new` (records `call.target`).
  - **Where**: `test/mock-function-context/call-context-test.js`
  - **Acceptance criteria**: Each scenario's `CallContext` fields match spec; thrown errors still reach the caller.
  - **Depends on**: Implement central invoke path on MockFunctionContext, Implement callCount() and getCall()

- [x] **Tests: mockImplementation / mockImplementationOnce / times**
  - **Story**: Behavior swapping; `times` option
  - **What**: Exercise `mockImplementation` replacing behavior mid-use, `mockImplementationOnce` applying to the next call only, `mockImplementationOnce(fn, onCall)` targeting a specific later index, throwing when `onCall` is in the past, and `times` auto-restoring after N calls.
  - **Where**: `test/mock-function-context/implementation-test.js`
  - **Acceptance criteria**: All cases assert expected call results; validation errors are `ProgrammerError`.
  - **Depends on**: Implement mockImplementationOnce(), Wire `times` option auto-restore

- [x] **Tests: resetCalls and restore**
  - **Story**: Clear history; restore original behavior
  - **What**: Verify `resetCalls()` zeros `callCount()` without reverting implementation; verify `.mock.restore()` on a `fn()` mock reverts to the original while continuing to record.
  - **Where**: `test/mock-function-context/reset-restore-test.js`
  - **Acceptance criteria**: Call counts and behaviors match spec.
  - **Depends on**: Implement resetCalls(), Implement restore() for fn mocks

- [x] **Tests: MockTracker.method()**
  - **Story**: Spy on object methods; mock getter/setter
  - **What**: Cover method mocking on a regular method (captures `this` as the object, restore reinstalls the original), mocking a getter, mocking a setter, rejecting when both `getter` and `setter` are set, rejecting when `object[methodName]` isn't a function (for regular method mode).
  - **Where**: `test/mock-tracker/method-test.js`
  - **Acceptance criteria**: Each scenario passes; original descriptors are restored exactly.
  - **Depends on**: Extend method() with getter/setter support

- [x] **Tests: restoreAll and reset**
  - **Story**: Tracker-wide lifecycle
  - **What**: Create several mocks (fn + method), call `restoreAll()` — confirm all revert; call `reset()` — confirm disassociation (later `restoreAll()` on new mocks doesn't affect the old ones; old mocks still callable).
  - **Where**: `test/mock-tracker/lifecycle-test.js`
  - **Acceptance criteria**: All assertions pass; behavior matches the `after(() => mock.reset())` pattern in the task example.
  - **Depends on**: Implement MockTracker.reset()
