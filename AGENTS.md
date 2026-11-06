# AGENTS.md

Guidance for AI coding agents working in the **Aura Router** repository (`aura-stack-ts/router`), published as `@aura-stack/router`.

Human contributors should refer to [CONTRIBUTING.md](./CONTRIBUTING.md) and the [official documentation](https://aura-stack-router.vercel.app).

## Project Overview

Aura Stack Router is a **TypeScript-first router and endpoint definition library**. You declare endpoints with `createEndpoint`, validate input using a schema library of your choice, group endpoints with `createRouter`, and consume them through a fully typed `createClient`.

Handlers work with native Web `Request` and `Response` objects, making the library **framework-agnostic and runtime-agnostic** (Node.js, Deno, Bun, Workers, and browsers through the client).

- **Repository:** https://github.com/aura-stack-ts/router
- **Issues:** https://github.com/aura-stack-ts/router/issues
- **Documentation:** https://aura-stack-router.vercel.app
- **License:** MIT

## Tech Stack and Requirements

- **Runtime:** Node.js `>=22`.
- **Package manager:** pnpm `12.4.0`, pinned through `packageManager`. Do not use npm or Yarn.
- **TypeScript:** `^5.9`, ESM (`"type": "module"`).
- **Build:** **tsdown** (`tsdown.config.ts`).
- **Tests and benchmarks:** **Vitest** (runtime tests: `*.test.ts`; type tests: `*.test-d.ts`; benchmarks: `bench/`).
- **Linting and formatting:** **oxlint** and **oxfmt** (`.oxlintrc.json`, `.oxfmtrc.json`).
- **Dual publishing:** **npm** and **JSR** (`deno.json` is kept in sync with `package.json`).

## Repository Structure

The repository is a pnpm workspace orchestrated through pnpm workspace tasks.

### Repository Layout

```text
.
├── docs/                  # Fumadocs documentation and MDX content
├── packages/
│   └── router/            # Router library
├── AGENTS.md              # Guidance for AI coding agents
├── pnpm-workspace.yaml
├── .oxlintrc.json
└── .oxfmtrc.json
```

### Router Package Structure

The following describes the main areas of the core package. Check the current source tree before relying on specific paths or filenames.

```text
packages/router/
├── src/
│   ├── @types/             # client.ts, http.ts, schemas.ts, types.ts, index.ts
│   ├── validator/          # registry.ts (schema-library adapters), formatter.ts
│   ├── assert.ts           # Runtime guards
│   ├── client.ts           # createClient
│   ├── context.ts          # Request context construction
│   ├── cookie.ts           # Cookie helpers (subpath export)
│   ├── endpoint.ts         # createEndpoint / createEndpointConfig
│   ├── error.ts            # Router error classes
│   ├── headers.ts          # HeadersBuilder
│   ├── hooks.ts            # Lifecycle hooks
│   ├── middlewares.ts
│   ├── on-error.ts
│   ├── response.ts
│   ├── router.ts           # createRouter
│   ├── trie.ts             # Route matching
│   └── index.ts            # Public entry point
├── test/                   # *.test.ts, client/*.test-d.ts (arktype, valibot, typebox)
├── bench/                  # router.bench.ts
├── tsdown.config.ts
├── vitest.config.ts
├── deno.json
├── package.json
└── CHANGELOG.md
```

## Commands

Run commands from the repository root unless a package-level command is explicitly required. Check the root and package `package.json` files for the authoritative scripts when a command is missing or behaves differently from this guide.

### Root Commands

Run these commands from the repository root. They fan out through `pnpm -r`.

| Command             | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm install`      | Install workspace dependencies.             |
| `pnpm build`        | Build packages and applications.            |
| `pnpm dev`          | Start the configured development servers.   |
| `pnpm dev:router`   | Run the router package in watch mode.       |
| `pnpm dev:docs`     | Start the documentation development server. |
| `pnpm test`         | Run package tests.                          |
| `pnpm type-check`   | Run TypeScript checks.                      |
| `pnpm format`       | Format supported files.                     |
| `pnpm format:check` | Check formatting without applying changes.  |

### Package-Level Commands

Run these commands from the relevant package directory, if defined by that package.

| Command           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | Run the package in watch mode.                         |
| `pnpm build`      | Build the package.                                     |
| `pnpm test`       | Run package tests.                                     |
| `pnpm test:watch` | Run tests in watch mode.                               |
| `pnpm test:types` | Run type-level tests.                                  |
| `pnpm test:bench` | Run benchmarks.                                        |
| `pnpm clean`      | Remove the package's build output.                     |
| `pnpm clean:cts`  | Remove generated `.d.cts` files from the build output. |

Do not assume every script exists in every package. Verify its `package.json` before running it.

## Conventions

### Code Style and Imports

- Use **oxfmt** for formatting and **oxlint** for linting. Do not introduce Prettier or ESLint configurations unless explicitly required by the task.
- Use `import type` for type-only imports.
- Use the `@/` alias within a package where supported. Follow existing import conventions and use relative imports where the alias is unavailable or inappropriate.
- Follow the repository's ESM and TypeScript conventions, including explicit `.ts` extensions where required.
- Document public APIs and types with TSDoc. Existing configuration types contain detailed JSDoc that also supports documentation generation.
- Prefer small, focused changes that preserve existing APIs and runtime compatibility.

### Testing

- **Test framework:** Vitest.
- **Unit and integration tests:** Follow the existing `*.test.ts` naming and directory conventions.
- **Type-level tests:** Use `*.test-d.ts` where applicable.
- **Fixtures:** Reuse existing fixtures and test helpers rather than duplicating setup.
- **Runtime compatibility:** When changing core functionality, consider the supported runtimes and test relevant runtime-specific behavior.
- **Security-sensitive changes:** Add regression tests for both expected behavior and relevant failure cases.

Run the narrowest relevant test suite during development, then run broader checks when practical.

### Documentation

- Documentation lives in `docs/` (MDX). Public API changes must include corresponding documentation updates in the same PR.
- Keep documentation and exports in sync: every documented import path must exist in the `package.json` `exports` map.
- Known documentation gaps to be aware of: runtime adapter guides (Node.js, Deno, Bun, and Next.js), an error reference page, and a comparison page. Do not invent content for these; base it on the source code and tests.

### Changelog and Releases

- Add user-visible changes to `packages/router/CHANGELOG.md`.
- Releases are handled in separate PRs that bump the version in both `package.json` **and** `deno.json`, and update the CHANGELOG. Do not bump versions in feature PRs.
- `publishConfig.access` is set to `public`.

### Commits and PRs

- Use Conventional Commits with a relevant scope. For example:
  - `feat(core): add provider support`
  - `fix(ci): correct workflow configuration`
  - `refactor(core): simplify session handling`
  - `chore(release): bump package versions`
  - `docs(core): clarify configuration`
  - `test(core): cover validation edge cases`
- The default branch is `master`. Open pull requests against `master` unless repository settings or task instructions specify otherwise.
- Keep changes focused and describe their impact clearly.
- Explicitly identify breaking changes, security-sensitive changes, and any behavior that requires migration.

## Security and Robustness Rules

- Treat path and parameter parsing, header and cookie handling, and body parsing as untrusted input handling. Do not use unsafe `eval` or dynamic code, introduce prototype-pollution-prone merges, or omit explicit URL encoding and decoding.
- Do not log request bodies, cookies, or authorization headers.
- Do not weaken validation or turn failures into silent successes to make a test pass.
- Do not add runtime dependencies without strong justification; the package should remain small and portable.

## Don't

- Do not edit generated output (`dist/`) or lockfiles by hand.
- Do not introduce Node.js-specific APIs or break the `exports` map.
- Do not rename or remove public exports without flagging a breaking change.
- Do not change `packageManager`, build tooling, or dependency versions unless explicitly required by the task.
