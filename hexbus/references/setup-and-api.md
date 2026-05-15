# Hexbus Setup And API Notes

Use this when wiring Hexbus into a package or when unsure which Hexbus primitive fits.

## Install And Package Setup

Hexbus expects a TypeScript ESM CLI package on Node 18.17+.

Typical package fields:

```json
{
  "type": "module",
  "bin": {
    "my-cli": "./dist/index.js"
  },
  "dependencies": {
    "hexbus": "<use the package manager to add the current version>"
  }
}
```

Entrypoints should start with the right shebang for the runtime:

```ts
#!/usr/bin/env node
```

Use `#!/usr/bin/env bun` only for Bun-only CLIs or examples.

## Which API To Use

- `runCli`: default for product entrypoints. Owns version, context, update checks, help, intro, command dispatch, hooks, telemetry shutdown, and error rendering.
- `createCliContext`: use when a legacy entrypoint keeps custom routing but wants Hexbus services.
- `dispatchCommand`: use when context exists and command-tree routing/interactive selection should be shared.
- `selectCommand`: use for a standalone interactive command menu.
- `parseCliArgs`: use for top-level command/global flag parsing only.
- `parseCommandArgs`: use inside command actions for local flags and positionals.
- `showHelpMenu`: use for custom help/no-command behavior.
- `isVersionRequest` and `printVersionInfo`: use only in custom lifecycle entrypoints; `runCli` already handles them.
- `startBackgroundUpdateCheck`: use only in custom lifecycle entrypoints; `runCli` already starts it unless disabled.

## `runCli` Lifecycle

`runCli` does this in order:

1. Reads `rawArgs` or `process.argv.slice(2)`.
2. Handles `--version` / `-v` before context creation.
3. Creates a base `CliContext`.
4. Runs `hooks.afterContext` and uses the returned context for commands.
5. Tracks CLI invocation telemetry.
6. Starts background update checks unless `updateCheck: false`.
7. Handles `--help` / `-h`, including scoped command help.
8. Rejects unknown command-looking options.
9. Dispatches the command tree or no-command behavior.
10. Tracks success/failure telemetry and shuts telemetry down.
11. Renders errors through shared error handling.

Do not duplicate this flow in new CLIs.

## Context Options

Pass context options through `runCli.context`:

```ts
context: {
  configName: "my-cli",
  cwd: process.cwd(),
  globalFlags,
  interactivePackageManagerDetection: true,
  packageMap: {
    core: "my-core-package",
    react: "@acme/react",
    next: "@acme/next",
  },
  telemetry: {
    defaultProperties: { cliVersion: packageInfo.version },
    envVarPrefix: "MY_CLI",
  },
}
```

Notes:

- `configName` is passed to `c12` for config lookup and respects `--config`.
- `packageMap` lets framework detection select product package IDs.
- `interactivePackageManagerDetection` may prompt when detection fails; keep it false for CI-heavy CLIs.
- `globalFlags` should extend `hexbus.globalFlags`, not replace them, unless intentionally changing reserved behavior.
- Telemetry is disabled when `--no-telemetry` is passed or the configured env var prefix disables it.

## Product Context Pattern

For product CLIs, create local aliases:

```ts
import type {
  CliCommand as HexbusCommand,
  CliContext as HexbusContext,
} from "hexbus";

export type AvailablePackages = "core" | "@acme/react" | "@acme/next";

export interface CliContext extends HexbusContext<AvailablePackages> {
  framework: HexbusContext<AvailablePackages>["framework"] & {
    pkg: AvailablePackages;
  };
}

export type CliCommand = HexbusCommand<CliContext>;
```

Use `afterContext` to normalize package selection or attach shared services:

```ts
export async function createCliContext(
  context: HexbusContext<AvailablePackages>
): Promise<CliContext> {
  return {
    ...context,
    framework: {
      ...context.framework,
      pkg: context.framework.pkg ?? "core",
    },
  };
}
```

This mirrors the c15t-style pattern: Hexbus creates the base context, the product adds only product semantics.

## Global Flags

Hexbus built-ins are reserved:

- `--help`, `-h`
- `--version`, `-v`
- `--logger <level>`
- `--color`, `--no-color`
- `--config <path>`
- `-y`, `--yes`
- `--no-telemetry`
- `--telemetry-debug`
- `--force`

Add global flags only for cross-cutting behavior. Command-local flags belong in `parseCommandArgs`.

## Command Trees And Help

`subcommands` are first-class. `runCli` resolves the deepest matching route, scopes help to the current command group, and gives the leaf action only the remaining args.

Help output uses:

- `name` for invocation.
- `description` for help rows.
- `label` and `hint` for interactive selection.
- `hidden` to omit from help and menus while still allowing direct resolution.

## Prompt Helpers

Public prompt helpers:

- `promptSelect`
- `promptMultiselect`
- `promptText`
- `promptConfirm`
- `createPromptToolkit`

Default cancellation throws `CliError("CANCELLED")`. Pass `cancel: "silent"` to receive `undefined`.

Use `context.confirm()` instead of `promptConfirm()` when `--yes` should auto-accept.

## Errors

Use built-in `CliError` codes for parser and common failures where possible. Add product codes once during startup:

```ts
extendErrorCatalog({
  CONFIG_EXISTS: {
    code: "CONFIG_EXISTS",
    message: "Configuration already exists",
    hint: "Re-run with --force to overwrite it.",
  },
});
```

Throw `new CliError("CONFIG_EXISTS", { details: configPath })` from command actions. Let `runCli` render and track it.

## Update Checks

`runCli` starts a background update check by default using `packageInfo.name` and `packageInfo.version`.

Use:

```ts
updateCheck: false
```

for private packages, local-only tools, tests, or CLIs where registry lookup is inappropriate.

Use object options for custom registry, cache TTL, package name, current version, or Homebrew formula metadata.
