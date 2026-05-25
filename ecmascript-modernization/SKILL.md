---
name: ecmascript-modernization
description: Use when modernizing JavaScript or TypeScript code to ECMAScript yearly features from ES2016 through ES2025; replacing older helper utilities with standard APIs; auditing a codebase for modern JS improvements; reviewing edition accuracy; or advising on TypeScript tsconfig target/lib settings.
metadata:
  author: custom
  version: "1.0.0"
  argument-hint: <edition-or-file-pattern>
---

# ECMAScript Modernization

Modernize JavaScript and TypeScript code to yearly ECMAScript standard APIs. The outcome is a codebase that is clearer, safer, smaller, and aligned with the newest runtime the project can honestly support.

## Pick The Edition

- ES2016: load `references/es2016.md` for `Array.prototype.includes` and exponentiation.
- ES2017: load `references/es2017.md` for `async`/`await`, `Object.values`, `Object.entries`, descriptors, string padding, and trailing commas.
- ES2018: load `references/es2018.md` for object rest/spread, async iteration, `Promise.prototype.finally`, and RegExp improvements.
- ES2019: load `references/es2019.md` for `flat`, `flatMap`, `Object.fromEntries`, string trimming, and optional catch binding.
- ES2020: load `references/es2020.md` for optional chaining, nullish coalescing, `Promise.allSettled`, dynamic import, `globalThis`, `BigInt`, and `matchAll`.
- ES2021: load `references/es2021.md` for logical assignment, `Promise.any`, `replaceAll`, numeric separators, and weak references.
- ES2022: load `references/es2022.md` for class fields, private fields, top-level await, `Error.cause`, `Object.hasOwn`, `.at`, and RegExp match indices.
- ES2023: load `references/es2023.md` for copy-on-write arrays, `findLast`, `findLastIndex`, symbols as `WeakMap` keys, and hashbang grammar.
- ES2024: load `references/es2024.md` for `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`, RegExp `/v`, well-formed strings, `Atomics.waitAsync`, and resizable/transferable buffers.
- ES2025: load `references/es2025.md` for iterator helpers, `Set` methods, import attributes and JSON modules, `RegExp.escape`, inline RegExp modifiers, `Promise.try`, and float16 APIs.

When the requested edition is unclear, inspect the code pattern first and load the matching reference. Load multiple year references only when the task spans multiple editions.

For whole-codebase modernization, load `references/codebase-audit.md`, `references/tsconfig-runtime-policy.md`, and `references/testing-checklist.md` before editing.

## Before Editing

1. Check the project's runtime baseline before using newer ECMAScript features. Do not add these APIs when the deployed Node.js, browser, edge, or embedded runtime does not support them unless the project already ships a proven polyfill strategy.
2. Check TypeScript version and `tsconfig.json`.
3. Prefer small, behavior-preserving replacements. Keep older code if it handles compatibility, ordering, mutation, binary memory semantics, or error behavior that the standard API does not match.
4. Add focused tests before deleting custom helpers.

## TypeScript Setup

Use the minimum TypeScript version that supports the edition's `target` and `lib` values:

- ES2016 through ES2022: supported by modern TypeScript; prefer current TypeScript rather than keeping an old compiler.
- ES2023: TypeScript 5.0+ with `"target": "ES2023"` and `"lib": ["ES2023", ...]`.
- ES2024: TypeScript 5.7+ with `"target": "ES2024"` and `"lib": ["ES2024", ...]`.
- ES2025: TypeScript 6.0+ with `"target": "ES2025"` and `"lib": ["ES2025", ...]`.

Browser example:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025", "DOM"]
  }
}
```

Non-browser example:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025"],
    "types": ["node"]
  }
}
```

If the project is on an older TypeScript version, use one of these paths:

- Upgrade TypeScript when possible.
- Temporarily use the existing runtime target plus `"lib": ["ESNext", ...]` for types, but only when the runtime/polyfill story is verified.
- Avoid adding the newer API if type support would require local ambient declarations that the project does not already maintain.

`target` controls emitted syntax. `lib` controls which built-in API types TypeScript knows about. These editions mostly add APIs, so `lib` is the setting that most often gates editor and type-checker support.

## Edition Boundary

Keep features in their correct edition:

- ES2016: `includes`, exponentiation.
- ES2017: async functions, object values/entries/descriptors, string padding.
- ES2018: object rest/spread, async iterables, promise `finally`, RegExp named groups/dotAll/lookbehind.
- ES2019: array flattening, `Object.fromEntries`, trim start/end, optional catch binding.
- ES2020: optional chaining, nullish coalescing, all-settled promises, dynamic import, `globalThis`, `BigInt`, `matchAll`.
- ES2021: logical assignment, first-fulfilled promises, `replaceAll`, numeric separators, weak references.
- ES2022: modern class fields/private fields, top-level await, error causes, `Object.hasOwn`, `.at`, match indices.
- ES2023: array copy methods, last-search array methods, symbols as `WeakMap` keys, hashbang grammar.
- ES2024: grouping, promise resolvers, RegExp `/v`, well-formed strings, atomics async wait, resizable/growable/transferable buffers.
- ES2025: set methods, import attributes, JSON modules, iterator helpers, `RegExp.escape`, inline RegExp modifiers, `Promise.try`, float16 APIs.

## Modernization Checklist

- Replace only when runtime support is available or the project already polyfills the exact API.
- Update `tsconfig.json` to the edition's TypeScript baseline and `target`/`lib`.
- Add tests around edge cases from the old helper before deleting it.
- Remove obsolete helper functions only after all call sites are migrated.
- Preserve public API compatibility; do not expose newer return types from a library unless its published support matrix allows them.
- Mention runtime and TypeScript requirements in changelogs or migration notes.

## Output Expectations

When applying this skill:

- Show each replacement as "use this now, not that" when explaining a change.
- Name the ECMAScript edition and feature being used.
- State the minimum TypeScript config expectation for that edition.
- Call out runtime compatibility risk separately from TypeScript type-checking support.
