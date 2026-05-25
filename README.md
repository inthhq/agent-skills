# Agent Skills

A collection of skills for AI coding agents following the Agent Skills format.

## Available Skills

### [`tsdoc-jsdoc-authoring`](./tsdoc-jsdoc-authoring)

Comprehensive TSDoc and JSDoc authoring skill for TypeScript and JavaScript codebases. Includes rule-based guidance, incorrect/correct examples, and VS Code hover-friendly patterns for object parameter properties.

### [`hexbus`](./hexbus)

Guidance for creating, improving, and reviewing high-quality CLIs with `hexbus`, including command design, argument parsing, CLI context services, help/version output, telemetry, errors, spinners, testing, and package manager/framework detection.

### [`ecmascript-modernization`](./ecmascript-modernization)

Guidance for modernizing JavaScript and TypeScript code to ECMAScript 2016 through 2025 APIs, with "use this now, not that" replacements, codebase audit workflows, tests, and TypeScript `target`/`lib` config guidance.

## Installation

```bash
npx skills add inthhq/agent-skills
```

## Usage

Skills are automatically activated when relevant tasks are detected. Example prompts:

- "Add TSDoc comments to this TypeScript API file."
- "Write JSDoc for this JavaScript utility module."
- "Document each object parameter property so VS Code hover shows descriptions."
- "Review these docs and fix missing @param/@returns tags."
- "Build a new TypeScript CLI with hexbus."
- "Review this hexbus command implementation for UX and testing gaps."
- "Modernize these helpers to newer ECMAScript APIs."
- "Audit this codebase for newer ECMAScript improvements."
- "Show the ES2023 replacement for this immutable array update."
- "Show the ES2025 replacement for this custom Set utility."
- "Update this TypeScript project to use ES2025 APIs safely."
- "Modernize this grouping helper to ES2024."
- "Replace this deferred promise helper with Promise.withResolvers."

## Skill Structure

- `tsdoc-jsdoc-authoring/SKILL.md`: Main skill behavior, triggers, and workflow.
- `tsdoc-jsdoc-authoring/AGENTS.md`: Full compiled rule index and category guide.
- `tsdoc-jsdoc-authoring/reference.md`: Deep reference and syntax cheatsheets.
- `tsdoc-jsdoc-authoring/rules/**`: Focused rule files with incorrect/correct examples.
- `hexbus/SKILL.md`: Main skill behavior, triggers, and workflow.
- `hexbus/examples/cli-entrypoint.ts`: Production-style CLI entrypoint example.
- `hexbus/references/**`: Focused CLI UX and testing references.
- `ecmascript-modernization/SKILL.md`: Main ES2016-ES2025 modernization router and tsconfig guidance.
- `ecmascript-modernization/references/**`: Focused edition guides with feature-by-feature replacements.

## Validation

```bash
npm run validate
```

This runs:

```bash
bunx skills-ref validate ./tsdoc-jsdoc-authoring && bunx skills-ref validate ./hexbus && bunx skills-ref validate ./ecmascript-modernization
```

## Prerequisites

- A Cursor/Codex environment with Agent Skills support
- `bunx` available for local validation

## License

MIT
