# Testing Checklist

Use this after applying ECMAScript modernizations.

## General

- Typecheck with the updated `target` and `lib`.
- Run unit tests for changed helpers and call sites.
- Run lint/format because parser support may lag runtime support.
- Run at least one integration path in the real target runtime.

## Feature-Specific Checks

Array copy methods:

- original array is not mutated
- comparator behavior is unchanged
- sparse arrays or typed arrays behave acceptably for the domain

Grouping:

- object grouping handles key coercion as expected
- `Object.groupBy()` null-prototype result does not break consumers
- `Map.groupBy()` preserves object key identity

Promises:

- `Promise.all()` replacements preserve fail-fast vs all-settled semantics
- `Promise.any()` only fails after every input rejects
- resolver ownership is clear when using `Promise.withResolvers()`
- sync throws are still captured when using `Promise.try()`

Regex:

- escaped user input cannot alter regex syntax
- `/v`, `/s`, named groups, and inline modifiers parse in test and build tooling
- Unicode edge cases are covered when replacing manual ranges

Objects:

- `Object.entries()` and `Object.fromEntries()` only need enumerable string-keyed properties
- descriptor-preserving copies are used only when descriptors matter
- `Object.hasOwn()` vs `in` semantics are intentional

Classes:

- `#private` fields do not break tests, serialization, mocks, or subclass access
- top-level await does not create unacceptable startup delays

Buffers and Atomics:

- resizing does not invalidate views unexpectedly
- transfer detaches the original buffer only when ownership should move
- shared-memory waits run only in environments with `SharedArrayBuffer` support

Libraries:

- emitted declarations do not expose unsupported built-in types
- README/package support matrix is updated when the baseline changes
