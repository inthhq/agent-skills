# TypeScript And Runtime Policy

Use this when deciding whether a codebase can adopt a newer ECMAScript edition.

## tsconfig Rules

`target` controls emitted syntax. `lib` controls type definitions for built-in APIs.

For app code, set both to the newest edition the runtime supports:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025", "DOM", "DOM.Iterable"]
  }
}
```

For Node-only code:

```json
{
  "compilerOptions": {
    "target": "ES2025",
    "lib": ["ES2025"],
    "types": ["node"]
  }
}
```

For libraries, be more conservative:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "declaration": true
  }
}
```

## Edition Baselines

- ES2016: `Array.prototype.includes`, `**`
- ES2017: `async`/`await`, `Object.values`, `Object.entries`, string padding
- ES2018: object rest/spread, async iteration, `Promise.prototype.finally`, regex improvements
- ES2019: `flat`, `flatMap`, `Object.fromEntries`, `trimStart`, `trimEnd`, optional catch binding
- ES2020: optional chaining, `??`, `Promise.allSettled`, dynamic import, `globalThis`, `BigInt`, `matchAll`
- ES2021: logical assignment, `Promise.any`, `AggregateError`, `replaceAll`, numeric separators
- ES2022: class fields/private fields, top-level await, `Error.cause`, `Object.hasOwn`, `.at`
- ES2023: copy-on-write arrays, `findLast`, `findLastIndex`, symbols as `WeakMap` keys, hashbang
- ES2024: grouping, promise resolvers, RegExp `/v`, well-formed strings, atomics async wait, resizable/transferable buffers
- ES2025: iterator helpers, `Set` methods, import attributes, JSON modules, `RegExp.escape`, inline RegExp modifiers, `Promise.try`, float16

## Compiler Version Policy

Use current TypeScript when possible. If a `target` or `lib` value is rejected, upgrade TypeScript before adding local ambient declarations.

Known minimums for this skill:

- ES2023: TypeScript 5.0+ recommended.
- ES2024: TypeScript 5.7+ for first-class `target`/`lib`.
- ES2025: TypeScript 6.0+ for first-class `target`/`lib`.

For ES2016 through ES2022, modern TypeScript versions support the edition values. Prefer upgrading to current TypeScript rather than preserving an old compiler just to modernize syntax.

## Runtime Policy

Do not confuse type support with runtime support. TypeScript does not polyfill built-ins.

Before modernizing:

- Node apps: check `engines.node`, Docker image, runtime docs, and CI matrix.
- Browser apps: check Browserslist, analytics, framework targets, and bundler output.
- Edge/serverless apps: check the provider runtime, not local Node.
- Libraries: check the published support matrix and avoid leaking newer built-ins in public APIs unless that matrix changes.

If runtime support is uncertain:

- keep the older code
- add a polyfill only if the project already has a polyfill strategy
- or make the runtime upgrade explicit in the change
