# Codebase Audit Workflow

Use this workflow when the user wants to make a codebase modern and excellent, not just convert one snippet.

## 1. Establish The Upgrade Envelope

Read:

- `package.json`
- `tsconfig.json` and any extended tsconfig files
- browserlist or deployment docs
- CI matrix, Dockerfile, runtime config, or package `engines`
- library README support matrix if this is a published package

Decide the newest safe ECMAScript edition:

- Apps can usually move faster because the runtime is controlled.
- Libraries must preserve their published support matrix.
- Test tools and bundlers must parse the syntax even when runtime supports it.

## 2. Search For Modernization Patterns

Prefer `rg` searches like these:

```bash
rg "\\.indexOf\\([^)]*\\)\\s*(!==|>=|===)\\s*(-1|0)"
rg "Math\\.pow\\("
rg "Object\\.keys\\([^)]*\\)\\.(map|forEach|reduce)"
rg "\\.then\\("
rg "Object\\.assign\\(\\{\\}"
rg "\\.catch\\(\\s*\\([^)]*\\)\\s*=>"
rg "\\[\\.\\.\\.[^\\]]+\\]\\.(sort|reverse)\\("
rg "\\.map\\([^\\n]+\\)\\.flat\\("
rg "\\|\\|\\s*[^;\\n]+"
rg "Promise\\.all\\("
rg "new Promise\\s*\\(\\s*\\("
rg "hasOwnProperty"
rg "\\[[^\\]]+\\.length\\s*-\\s*1\\]"
rg "replace\\(/.+/g"
rg "groupBy|deferred|escapeRegExp|promiseTry|flatten|omit"
rg "Array\\.from\\([^)]*\\)\\.(map|filter|slice)"
rg "new Set\\(\\[\\.\\.\\.[^\\]]+\\]\\.filter"
```

These are leads, not automatic edits. Read each match.

## 3. Rank The Opportunities

Prioritize changes that improve correctness or reduce helper code:

1. `||` defaults that should be `??`
2. accidental array mutation that should be copy-on-write
3. hand-written promise resolver/deferred helpers
4. custom regex escaping
5. manual `Set` algebra
6. group-by reducers
7. repeated compatibility helpers that can be deleted

Deprioritize:

- style-only churn
- hot-path changes without benchmarks
- public API changes in libraries
- syntax your formatter, linter, or test runner cannot parse

## 4. Apply In Small Batches

For each batch:

1. Name the edition and feature.
2. Show "use this now, not that" in the explanation.
3. Add or update focused tests before deleting old helpers.
4. Run typecheck, tests, and lint.
5. Delete helpers only after all call sites are migrated.

## 5. Report The Outcome

Summarize:

- editions enabled
- `tsconfig` changes
- runtime assumptions
- helpers deleted
- behavior-preserving tests added
- risks left behind
