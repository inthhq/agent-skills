---
name: hexbus
description: Use when creating, migrating, improving, or reviewing TypeScript CLIs with hexbus, including runCli setup, command trees, command-local args, CliContext extension, prompts, help/version output, telemetry, errors, spinners, tests, and moving existing Clack/manual parsers to Hexbus.
---

# Hexbus

Use this skill to create or migrate good CLIs with `hexbus`, the opinionated TypeScript ESM CLI framework from https://github.com/inthhq/hexbus.

## Start Here

- Do not assume the upstream `hexbus` monorepo exists in the user's workspace.
- For public API intent, use installed package docs or read https://github.com/inthhq/hexbus/blob/main/packages/hexbus/README.md.
- Check `packages/hexbus/src/index.ts` or the installed `.d.ts` exports before assuming an API exists.
- Prefer `runCli` for new product CLIs. Use lower-level `createCliContext`, `dispatchCommand`, and `showHelpMenu` only when the entrypoint needs bespoke lifecycle control.
- When editing this skill repo itself, a vendored snapshot may exist at `inrepo_modules/hexbus`; treat GitHub as the portable source for agents that only receive the skill.
- Keep `hexbus` and `@inth/hexbus-*` packages free of product-specific imports and copy.

## Choose A Path

- **New CLI**: load `references/new-cli-playbook.md`, then `examples/cli-entrypoint.ts`.
- **Migrating an existing CLI**: load `references/migration-playbook.md`; also load the old entrypoint and current e2e tests.
- **Setup/API confusion**: load `references/setup-and-api.md`.
- **UX/design review**: load `references/good-cli-checklist.md`.
- **Tests**: load `references/testing-hexbus-clis.md`.

## Default Consumer Pattern

Build product CLIs around a data-first command table and `runCli`:

```ts
import { runCli, type CliCommand } from "hexbus";
```

1. Define `CliCommand[]` with stable `name`, `label`, `hint`, `description`, and an async `action(context)`.
2. Pass `appName`, `commands`, `packageInfo`, `context.configName`, `intro`, `help`, and `noCommand` to `runCli`.
3. Put product-specific context augmentation in `hooks.afterContext`, returning an extended context type.
4. Put lifecycle logging/telemetry in `hooks.beforeCommand`, `afterCommand`, and `onError`.
5. Use `subcommands` for command trees; `runCli` dispatches to the deepest matching action and rewrites `context.commandArgs` to the remaining args.
6. Use `parseCommandArgs(context.commandArgs, spec)` inside command actions for command-local flags and positionals.

## Context Services

Prefer existing `CliContext` services over ad hoc utilities:

- `context.logger` for user-facing output and progress steps.
- `context.confirm()` for prompts; it respects `-y` / `--yes`.
- `context.config.loadConfig()` and `requireConfig()` for config loading.
- `context.fs` for project-rooted package info and file access.
- `context.packageManager` for install, add, run, and exec command strings.
- `context.framework` for detected framework/package metadata.
- `context.telemetry` for best-effort lifecycle and command events.
- `context.error` for normalized cancellation and error exits.

Extend `CliContext<TPackage>` when a product CLI injects app-specific services, but keep command implementations typed against the smallest context they need. A common pattern is `type ProductCommand = CliCommand<ProductContext>` plus `runCli<AvailablePackages, ProductContext>({ hooks: { afterContext } })`.

## Errors And UX

- Throw `CliError` for expected user-facing failures.
- Use `extendErrorCatalog` for product-specific error codes.
- Let `runCli` own top-level error rendering when possible; use `withErrorHandling` only in custom lifecycle entrypoints.
- Use Hexbus prompt helpers (`promptSelect`, `promptMultiselect`, `promptText`, `promptConfirm`, `context.confirm`) instead of importing `@clack/prompts` directly.
- Use `displayIntro`, `createSpinner`, `withSpinner`, `color`, `renderFiglet`, and `showHelpMenu` for terminal UX.
- Do not print raw stack traces for expected CLI failures.

## Migration Rules

- Preserve existing observable behavior first: help text, exit codes, stderr/stdout split, no-arg behavior, env vars, interactive cancellation, and e2e tests.
- Replace manual top-level parsing with `runCli` only after creating a command table matching the old behavior.
- Replace command-specific parsers with `parseCommandArgs`; avoid treating product-local flags as global flags unless they truly apply to every command.
- Replace direct Clack prompts with Hexbus prompt helpers so prompt UX, cancellation, and telemetry stay consistent.
- Keep domain logic in plain functions. Command actions should parse args, call services, and render results.
- If a CLI has special no-argument behavior, use `noCommand: { mode: "custom", action }` or `mode: "interactive"` instead of hand-rolled dispatch.

## Editing Hexbus

- If the user's workspace is a checkout of https://github.com/inthhq/hexbus, edit local files there. Otherwise, explain the relevant GitHub paths and provide patches or guidance against the upstream source.
- Keep public exports centralized in `packages/hexbus/src/index.ts` in the upstream repo.
- Add or update focused Vitest coverage when changing parser, context, detection, errors, telemetry, color, or update behavior.
- Preserve the framework-style boundary: shared CLI primitives belong in `hexbus`; product decisions belong in consuming packages.
- Prefer small explicit APIs over broad abstractions.
- Update `packages/hexbus/readie.json` in the upstream repo when README-facing docs change, then regenerate docs with the repo script.

## Bundled Resources

- Load `references/new-cli-playbook.md` when scaffolding a CLI or new command family.
- Load `references/migration-playbook.md` when converting an existing CLI to Hexbus.
- Load `references/setup-and-api.md` when wiring package setup, context extension, global flags, command trees, prompts, telemetry, or update checks.
- Load `references/good-cli-checklist.md` when designing, reviewing, or improving CLI UX.
- Load `references/testing-hexbus-clis.md` when adding tests or planning coverage.
- Load `examples/cli-entrypoint.ts` when scaffolding a new production-style CLI entrypoint.

## Commands

When working in an upstream `hexbus` checkout, use Bun from that repo root:

- `bun run test --filter=hexbus`
- `bun run check-types --filter=hexbus`
- `bun run lint --filter=hexbus`
- `bun run build --filter=hexbus`
- `bun run readie`
- `bun x ultracite fix`
