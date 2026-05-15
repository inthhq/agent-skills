#!/usr/bin/env bun
// @ts-nocheck -- Bundled skill example; copy into a CLI package with hexbus installed.

import { readFileSync } from "node:fs";

import {
  CliError,
  extendErrorCatalog,
  parseCommandArgs,
  runCli,
  withSpinner,
} from "hexbus";
import type {
  CliCommand as HexbusCliCommand,
  CliContext as HexbusCliContext,
  PackageInfo,
} from "hexbus";

type AvailablePackages = "my-cli" | "@acme/react" | "@acme/next";

interface CliContext extends HexbusCliContext<AvailablePackages> {
  framework: HexbusCliContext<AvailablePackages>["framework"] & {
    pkg: AvailablePackages;
  };
}

type CliCommand = HexbusCliCommand<CliContext>;

extendErrorCatalog({
  CONFIG_EXISTS: {
    code: "CONFIG_EXISTS",
    hint: "Re-run with --force to overwrite the existing configuration.",
    message: "Configuration already exists",
  },
});

function readOwnPackageInfo(): PackageInfo {
  const packageJsonUrl = new URL("../package.json", import.meta.url);
  const parsed = JSON.parse(readFileSync(packageJsonUrl, "utf-8")) as Record<
    string,
    unknown
  >;

  return {
    name: typeof parsed.name === "string" ? parsed.name : "my-cli",
    version: typeof parsed.version === "string" ? parsed.version : "unknown",
  };
}

async function createProductContext(
  context: HexbusCliContext<AvailablePackages>
): Promise<CliContext> {
  return {
    ...context,
    framework: {
      ...context.framework,
      pkg: context.framework.pkg ?? "my-cli",
    },
  };
}

async function initCommand(context: CliContext): Promise<void> {
  context.logger.step(1, 2, "Inspect project");

  const configPath = `${context.projectRoot}/my-cli.config.json`;
  const configExists = await context.fs.exists(configPath);

  if (configExists && !context.flags.force) {
    throw new CliError("CONFIG_EXISTS", { details: configPath });
  }

  const shouldWrite = await context.confirm("Write my-cli.config.json?", true);

  if (!shouldWrite) {
    context.error.handleCancel("No files changed.", {
      command: "init",
      stage: "confirm-write",
    });
  }

  context.logger.step(2, 2, "Write config");

  await withSpinner(
    "Creating config",
    () =>
      context.fs.write(
        configPath,
        `${JSON.stringify({ schema: 1 }, null, 2)}\n`
      ),
    {
      successMessage: "Created my-cli.config.json",
    }
  );

  context.logger.success(
    `Run ${context.packageManager.runCommand} my-cli doctor to verify setup.`
  );
}

async function doctorCommand(context: CliContext): Promise<void> {
  const parsed = parseCommandArgs(context.commandArgs, {
    flags: {
      json: { defaultValue: false, names: ["--json"], type: "boolean" },
    },
  });
  const packageInfo = context.fs.getPackageInfo();

  if (parsed.flags.json) {
    context.logger.message(
      JSON.stringify(
        {
          framework: context.framework.framework,
          packageManager: context.packageManager.name,
          project: packageInfo.name,
        },
        null,
        2
      )
    );
    return;
  }

  context.logger.info(`Project: ${packageInfo.name}`);
  context.logger.info(`Package manager: ${context.packageManager.name}`);

  if (context.framework.framework) {
    context.logger.info(`Framework: ${context.framework.framework}`);
  }

  context.logger.success("Project looks ready.");
}

const commands: CliCommand[] = [
  {
    action: initCommand,
    description: "Create the project configuration file.",
    hint: "Set up config",
    label: "Initialize",
    name: "init",
  },
  {
    action: doctorCommand,
    description: "Check whether the current project is ready.",
    hint: "Verify setup",
    label: "Doctor",
    name: "doctor",
  },
];

async function main(): Promise<void> {
  const packageInfo = readOwnPackageInfo();

  await runCli<AvailablePackages, CliContext>({
    appName: "my-cli",
    commands,
    context: {
      configName: "my-cli",
      packageMap: {
        core: "my-cli",
        next: "@acme/next",
        react: "@acme/react",
      },
    },
    hooks: {
      afterContext: createProductContext,
      beforeCommand: ({ commandNames, context }) => {
        context.logger.debug(`Executing command: ${commandNames.join(" ")}`);
      },
    },
    intro: {
      tagline: "Project automation for my product.",
    },
    noCommand: {
      mode: "interactive",
    },
    packageInfo,
  });
}

await main();
