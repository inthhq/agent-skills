# New Hexbus CLI Playbook

Use this when creating a new TypeScript CLI or adding a substantial command family to an existing Hexbus CLI.

## Target Shape

A production Hexbus CLI usually has:

- `src/index.ts`: tiny executable entrypoint that reads package metadata and calls `runCli`.
- `src/context/types.ts`: product `CliContext` and `CliCommand` aliases when the base context needs stronger package typing or extra services.
- `src/context/creator.ts`: `afterContext` augmentation that returns the product context.
- `src/commands/<name>/index.ts`: one command definition plus focused command action helpers.
- `src/commands/<name>/*.test.ts`: command logic and parser tests.
- `src/e2e/*.test.ts`: process tests for startup behavior, help, version, unknown commands, and one representative workflow.

Keep the executable entrypoint boring. The command table is the source of truth for help, dispatch, interactive menus, telemetry names, and tests.

## Entrypoint Skeleton

Start from `examples/cli-entrypoint.ts`. The key pieces are:

```ts
await runCli<AvailablePackages, ProductContext>({
  appName: "my-cli",
  commands,
  packageInfo,
  context: {
    configName: "my-cli",
    cwd: process.cwd(),
    packageMap: {
      core: "my-core-package",
      react: "@acme/react",
      next: "@acme/next",
    },
    telemetry: {
      defaultProperties: { cliVersion: packageInfo.version },
      envVarPrefix: "MY_CLI",
    },
  },
  hooks: {
    afterContext: createProductContext,
  },
  noCommand: { mode: "interactive" },
});
```

Use `updateCheck: false` only for private/internal CLIs or test fixtures where registry lookup is unwanted.

## Commands

Define commands as data:

```ts
export const initCommand: CliCommand = {
  name: "init",
  label: "Initialize",
  hint: "Create config and install packages",
  description: "Set up Acme in the current project.",
  action: runInit,
};
```

Guidelines:

- Use lowercase, script-friendly names: `init`, `doctor`, `sync`, `deploy`, `self-host`.
- Use `subcommands` for command families instead of parsing nested commands manually.
- Parent commands with no `action` act as groups. `runCli` shows scoped help or opens an interactive subcommand menu depending on `noCommand`.
- Parent commands with an `action` should only exist when the parent itself has behavior.
- Mark escape hatches `hidden: true` when they should resolve directly but not appear in help or menus.

## Command-Local Args

Global flags are for behavior that applies across the whole CLI. Product-local flags belong inside command actions:

```ts
import { parseCommandArgs } from "hexbus";

const args = parseCommandArgs(context.commandArgs, {
  positionals: [{ name: "name", required: true }],
  flags: {
    dev: { names: ["-D", "--dev"], type: "boolean", defaultValue: false },
    git: { names: ["--git"], type: "string", valueName: "url" },
    ref: { names: ["--ref"], type: "string", valueName: "ref" },
    save: {
      names: ["--save"],
      type: "boolean",
      defaultValue: true,
      negatedName: "--no-save",
    },
  },
});
```

`parseCommandArgs` throws `CliError` for missing values, unknown options, required positionals, and unexpected extra positionals. Let `runCli` render those.

## Context Extension

Use a product context when command actions need stronger package typing or shared services:

```ts
import type {
  CliCommand as HexbusCommand,
  CliContext as HexbusContext,
} from "hexbus";

export type AvailablePackages = "core" | "@acme/react" | "@acme/next";

export interface ProductContext extends HexbusContext<AvailablePackages> {
  apiClient: ApiClient;
}

export type CliCommand = HexbusCommand<ProductContext>;
```

Then add services in `afterContext`:

```ts
export async function createProductContext(
  context: HexbusContext<AvailablePackages>
): Promise<ProductContext> {
  return {
    ...context,
    apiClient: createApiClient({ logger: context.logger }),
  };
}
```

Avoid hiding slow network work inside context creation. Context should initialize shared services, not execute the command.

## Prompts And Noninteractive Use

- Use `context.confirm()` when `-y` / `--yes` should skip a confirmation.
- Use `promptSelect`, `promptMultiselect`, `promptText`, and `promptConfirm` when a prompt should always render.
- Pass `telemetry: context.telemetry` and a stable `stage` to prompt helpers in multi-step flows.
- Use `cancel: "silent"` only when the command needs to decide how to render cancellation.
- Provide env var or flag alternatives for prompts needed in CI.

## Help, Version, And No Command

`runCli` handles `--version` before context creation. It handles `--help` after context creation so configured flags and scoped command help are available.

Choose no-command behavior deliberately:

- `noCommand: { mode: "help" }`: scripts and CI-oriented CLIs.
- `noCommand: { mode: "interactive" }`: user-facing setup CLIs with safe default menus.
- `noCommand: { mode: "custom", action }`: CLIs with first-run initialization or non-TTY differences.

## Output

- Use `context.logger` for normal output.
- Use `withSpinner` / `createSpinner` for slow work.
- Keep debug detail behind `--logger debug`.
- Print next actions after successful setup commands.
- Keep expected failures as `CliError` with recovery hints.
