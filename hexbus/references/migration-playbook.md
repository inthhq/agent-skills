# Migrating Existing CLIs To Hexbus

Use this when converting an existing TypeScript CLI with manual parsing, direct `@clack/prompts`, custom help text, or ad hoc error handling to Hexbus.

## Migration Goal

Move the CLI onto Hexbus incrementally while preserving user-facing behavior:

- Same command names and aliases.
- Same help/version behavior unless intentionally improving it.
- Same exit codes.
- Same stdout vs stderr behavior where tests or shell pipelines rely on it.
- Same noninteractive behavior and env var overrides.
- Same cancellation behavior for interactive flows.

If the CLI has e2e tests, migrate against those first. If it does not, add process tests for current behavior before changing the entrypoint.

## Audit The Current CLI

Before editing, write down:

- Top-level command list, subcommands, hidden commands, and aliases.
- Global flags versus command-local flags.
- No-argument behavior in TTY and non-TTY mode.
- `--help`, `-h`, `--version`, `-v`, unknown command, and unknown option behavior.
- Prompt library usage and cancellation handling.
- Where output intentionally goes to stderr.
- Current config lookup and env vars.
- Existing telemetry, analytics, or update checks.
- Process-level tests that assert exact text.

Manual CLIs often mix four concerns in one file: parser, router, UI frame, and domain work. Hexbus gives each a home, but the observable contract should move first.

## Recommended Migration Order

1. Add `hexbus` to the CLI package and remove direct terminal dependencies only after all prompt usage has moved.
2. Extract command actions into functions that accept the current product context shape.
3. Create a `CliCommand[]` table matching the old command list.
4. Replace manual nested command lookup with `subcommands` where possible.
5. Convert command-specific parsers to `parseCommandArgs`.
6. Replace direct `@clack/prompts` imports with Hexbus prompt helpers.
7. Replace the top-level lifecycle with `runCli`.
8. Use hooks and `noCommand` customization to preserve old special behavior.
9. Update tests around intentional help formatting changes only after behavior is otherwise stable.

## Manual Parser To Command Table

Old shape:

```ts
const [, , cmd, ...rest] = process.argv;
if (cmd === "sync") await cmdSync(cwd, rest);
else if (cmd === "add") await cmdAdd(cwd, rest);
else throw new Error(`Unknown command: ${cmd}`);
```

Hexbus shape:

```ts
const commands: CliCommand[] = [
  { name: "sync", label: "Sync", hint: "Refresh packages", description: "...", action: runSync },
  { name: "add", label: "Add", hint: "Vendor a package", description: "...", action: runAdd },
];
```

The command action receives `context.commandArgs`, already stripped of the command name.

## Command-Local Parser Migration

Old shape:

```ts
function parseAddArgs(argv: string[]) {
  // manual loop over --git, --ref, --no-save, positionals
}
```

Hexbus shape:

```ts
const parsed = parseCommandArgs(context.commandArgs, {
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

Only promote a flag to `context.globalFlags` when it applies across most commands, should appear in global help, and should be parsed before command dispatch. Product examples: `--resume`, `--debug`, or `--dry-run` if genuinely cross-command.

## Clack Prompt Migration

Replace direct Clack imports:

- `select` -> `promptSelect`
- `multiselect` -> `promptMultiselect`
- `text` -> `promptText`
- `confirm` -> `promptConfirm` or `context.confirm`
- `spinner` -> `createSpinner` or `withSpinner`
- `log.*`, `intro`, `outro`, `cancel` -> `context.logger`, `displayIntro`, and `context.error.handleCancel`

Important differences:

- Hexbus prompt helpers throw `CliError("CANCELLED")` by default.
- Pass `cancel: "silent"` when the old flow returned `null` or printed its own cancellation message.
- `context.confirm()` respects `-y` / `--yes`; `promptConfirm()` always prompts.
- Prompt helpers can receive `telemetry` and `stage`.

## No-Args And Interactive Menus

For CLIs that print help in non-TTY but open a menu or init wizard in TTY, use custom no-command behavior:

```ts
noCommand: {
  mode: "custom",
  async action({ context, commands, packageInfo }) {
    if (!canPromptInteractively()) {
      showHelpMenu(context, { appName: "my-cli", version: packageInfo.version }, commands, globalFlags);
      if (!isInitialized(context.projectRoot)) process.exitCode = 1;
      return;
    }

    if (!isInitialized(context.projectRoot)) {
      await runInit(context);
      return;
    }

    const result = await selectCommand(context, commands, {
      message: "What would you like to do?",
    });
    if (result.type === "selected") await result.command.action?.(context);
  },
}
```

Use plain `noCommand: { mode: "interactive" }` when the CLI can always open a safe command menu.

## Nested Commands

Prefer Hexbus command trees:

```ts
export const selfHostCommand: CliCommand = {
  name: "self-host",
  label: "Self-host",
  hint: "Self-hosted workflow tools",
  description: "Self-host workflow commands.",
  subcommands: [
    {
      name: "migrate",
      label: "Migrate",
      hint: "Run migrations",
      description: "Run self-hosted migrations.",
      action: runMigrate,
    },
  ],
};
```

When invoked as `cli self-host migrate prod`, the `migrate` action receives `context.commandArgs` as `["prod"]`. For `cli self-host --help`, `runCli` renders scoped help.

## Errors And Exit Codes

- Convert expected user-fixable failures to `CliError` or extend the catalog with `extendErrorCatalog`.
- Let `runCli` render errors through `context.error.handleError`.
- If legacy tests require a specific stderr message, add a catalog entry or keep a thin compatibility wrapper during migration.
- Avoid `process.exit()` in command actions. Set `process.exitCode` only for deliberate non-throwing outcomes, such as verify commands that return a boolean and print details.

## Tests To Keep Green

At minimum, protect:

- `cli --help` and `cli -h`.
- `cli --version` and `cli -v`.
- No args in TTY-relevant and non-TTY-relevant paths.
- Unknown top-level command.
- Unknown nested subcommand.
- Unknown local command option.
- Missing required local flag value.
- Missing and extra positionals.
- Prompt cancellation.
- One representative successful command.

Unit-test command actions with `createTestContext`; process-test the entrypoint with spawned CLI tests.
