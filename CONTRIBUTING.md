<!--
  CONTRIBUTING.md
  Guidelines for contributing to the @addon-core/inject-css project.
-->

# Contributing to @addon-core/inject-css

This package provides one typed CSS insertion and removal contract across Manifest V2 and Manifest V3. Contributions should preserve that boundary, keep unsupported capabilities explicit, and include verification for every affected adapter. By participating, you agree to abide by the project’s [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents

1. [Reporting Bugs](#reporting-bugs)
2. [Suggesting Enhancements](#suggesting-enhancements)
3. [Development Setup](#development-setup)
4. [Scripts](#scripts)
5. [Contract Guidelines](#contract-guidelines)
6. [Pull Request Workflow](#pull-request-workflow)
7. [Code Style & Quality](#code-style--quality)
8. [Commit Messages](#commit-messages)
9. [Versioning Policy](#versioning-policy)
10. [Automated Dependency Updates](#automated-dependency-updates)
11. [Code of Conduct](#code-of-conduct)
12. [License](#license)

---

## Reporting Bugs

To file a clear and actionable bug report:

1. Search existing issues to see if the bug has already been reported.
2. If not, open a new issue at https://github.com/addon-stack/inject-css/issues and include:
    - A descriptive title.
    - Steps to reproduce the problem.
    - Expected vs. actual behavior.
    - Environment details (OS, browser, Node.js/npm versions).
    - Any relevant stack traces or screenshots.

## Suggesting Enhancements

For feature requests or enhancements:

1. Check open issues for similar proposals.
2. Open a new issue with:
    - A clear use case or motivation.
    - Proposed API or code examples (if available).
    - Any alternatives you considered.

## Development Setup

1. Fork this repository.
2. Clone your fork:
   ```bash
   git clone git@github.com:<your-username>/inject-css.git
   cd inject-css
   ```
3. Add the upstream remote (optional):
   ```bash
   git remote add upstream git@github.com:addon-stack/inject-css.git
   ```
4. Use Node.js 22.23.3 and install the committed npm lockfile:
   ```bash
   npm ci
   ```
   Keep `package-lock.json` in sync with `package.json`; CI and Renovate use npm.

## Scripts

The following scripts are available and should be used during development:

- `npm run build` — build the project with tsup
- `npm run build:watch` — build in watch mode
- `npm run dev` — build in watch mode
- `npm run format` — format code with Biome
- `npm run format:check` — check formatting only
- `npm run lint` — lint code with Biome
- `npm run lint:fix` — attempt to automatically fix lint issues
- `npm run lint:fix:aggressive` — fix lint issues using unsafe rules
- `npm run lint:fix:unsafe` — fix lint issues using unsafe rules
- `npm run typecheck` — run TypeScript type checks
- `npm run test:types` — type-check public API contract fixtures
- `npm run test` — type-check fixtures, build the package, and run Jest and release tooling tests
- `npm run test:ci` — type-check fixtures, build, and run Jest with coverage; CI runs release tooling separately on Node.js 22.23.3
- `npm run test:tooling` — check Renovate commits, commitlint, release parsing, and generated dependency release notes
- `npm run release` — trigger release via release-it

Note: Husky hooks are configured. Commit messages are validated with commitlint, pre-commit runs `lint-staged`, and pre-push runs the full type/test/build path.

## Contract Guidelines

- Every operation has one explicit `target`.
- `allFrames`, `frameIds`, and `documentIds` remain mutually exclusive.
- Unsupported targets and options fail explicitly; they are never removed silently or replaced with a broader target.
- `insert()`, `file()`, `remove()`, and `removeFile()` remain strict `Promise<void>` operations because native CSS APIs expose no portable per-frame result.
- File order is part of the CSS cascade contract and must be preserved.
- Omitted options preserve native defaults.
- Explicit `undefined` values passed to `options()` reset the corresponding option.
- Removal must preserve the caller's exact source, target, and origin; the package does not track prior insertions.
- Frame enumeration, document discovery, and application-specific result aggregation remain outside this package.

## Pull Request Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes in TypeScript under `src/`.
3. Ensure local checks pass before opening a PR:
   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npm run build
   npm run test
   ```
4. Commit changes using [Conventional Commits](https://www.conventionalcommits.org/).
5. Push to your fork and open a Pull Request against the `develop` branch.
6. Provide a clear title and description, referencing related issues (e.g., `Closes #123`).

## Code Style & Quality

- Language: TypeScript
- Formatting & Linting: Biome (see `biome.json`)

Please run `npm run format` and `npm run lint` before submitting code. Type safety is enforced via `npm run typecheck`.

GitHub Actions runs lint, source and public API type checks, tests, coverage, and a production build. Pull requests into `main` and release runs use Ubuntu 24.04 and Windows with Node.js 18, 20, and 22. Pushes to `develop` use Ubuntu 24.04 with Node.js 20. Release tooling runs in a separate Node.js 22.23.3 job on every CI run. The aggregate **CI passed** check also requires release tooling tests and strict Renovate configuration validation; failed, cancelled, or skipped prerequisites fail this check.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages are validated by commitlint.

Format:
```
<type>[optional scope]: <description>
```

Common types:

- `feat`: a new feature
- `fix`: a bug fix
- `deps`: dependency updates
- `ci`: workflow and CI configuration changes
- `docs`: documentation only changes
- `style`: formatting, missing semicolons, etc
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding missing tests or correcting existing tests
- `chore`: updating build tasks, package manager configs, etc

Example:
```
feat(core): add new API method for X
```

## Versioning Policy

Release versions are derived from commit history by `release-it` and `@release-it/conventional-changelog`:

- A breaking change increments major at `1.x` and newer.
- A breaking change increments minor while the package is on `0.x`.
- `feat` and `revert` increment minor.
- `fix`, `deps`, `perf`, and `refactor` increment patch.
- `docs`, `test`, `build`, `chore`, `ci`, and `style` do not trigger a release by themselves.
- When several changes are present, the highest applicable increment wins.

Do not edit released changelog entries manually. `CHANGELOG.md` is generated from Conventional Commits during release.

## Automated Dependency Updates

The **Update Dependencies** workflow runs every Sunday at **02:15 America/Los_Angeles** and can also be started from **Actions → Update Dependencies → Run workflow**. The time follows Los Angeles daylight saving rules.

Renovate reads `renovate.json` from `main` and updates only `@addon-core/browser` and `@types/chrome`, together with their required lockfile changes. Stable updates of any size are grouped in one `deps/update-dependencies` branch and one PR into `main`, including Chrome-types-only updates. Other direct dependencies and standalone lockfile maintenance are disabled.

On each run, Renovate refreshes its branch from the current `main` when needed. An open bot-managed PR is updated in place. After merging, a future update can recreate the same branch name. No available update means no empty PR. Manually committing to an open bot branch pauses automatic updates to protect those commits.

The bot creates `deps: update dependencies` commits. Ordinary dependency-only changes trigger a **patch** release and appear under **📦 Dependencies** in the changelog and GitHub release notes. Keep the `deps: ...` title when squashing. Breaking markers and other commits still follow the normal release policy.

The App token triggers the normal PR checks: lint, source and public API type checks, build, tests, and strict Renovate configuration validation. **Merging remains manual.** Failed checks leave the PR open and do not publish a release. After merge, the existing Release workflow repeats the full checks, publishes the package, and syncs `main` back into `develop`.

Keep `conventional-commits-parser` 7.x as an explicit development dependency. The release tooling uses parser 7.x, while commitlint keeps its own parser 5.x. The explicit dependency also makes the release integration tests independent of transitive hoisting. After changing it, regenerate the lockfile in a clean directory and verify `npm ci` and the release tooling tests.

### Release tooling and security audits

The release setup uses `release-it` 21.x, `@release-it/conventional-changelog` 12.x, and `conventional-commits-parser` 7.x. Use Node.js 22.23.3 for development and releases; the release tools require at least 22.22.2 in the Node.js 22 line. CI still checks the library on Node.js 18, 20, and 22, but runs the newer release tools separately. The changelog uses the writer's `template(context)` function API, preserving sections, breaking notes, commit links and bodies, contributors, and the `deps`/`ci` version policy.

There are no npm `overrides`. Review both `npm audit` and `npm audit --omit=dev` after dependency updates, and rerun the checks plus a release dry-run with publishing disabled.

As of 2026-10-14, the latest upstream releases still contain two affected development-tool dependency chains:

- `release-it` → `proxy-agent` → `pac-proxy-agent` → `get-uri` → `basic-ftp` 5.3.1: [high-severity FTP directory-listing denial of service](https://github.com/advisories/GHSA-c475-qrg2-pj4r). The fix exists in Basic FTP 6.2.1+, but even get-uri 8.0.1 still requests 5.x. This requires an attacker-controlled FTP listing; it does not establish that ordinary HTTPS publishing is affected.
- Jest → babel-plugin-istanbul → @istanbuljs/load-nyc-config → js-yaml 3 → argparse 1 → sprintf-js: [moderate-severity denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). No patched sprintf-js release is available. Exploitation requires control over a format string.

These advisories also mark their parent packages, so the full audit reports 6 high and 19 moderate affected entries, not 25 independent root vulnerabilities. The production-only audit is clean. Keep these limitations explicit until upstream releases fix the chains; do not silently restore overrides or use `npm audit fix --force` to hide the remaining warnings.

### Connect the shared GitHub App

Reuse the existing organization App **addon-stack-dependency-updates**; each package keeps its own workflow and dependency rules.

1. In the `addon-stack` organization settings, open **GitHub Apps → Configure** for the existing installation and add **inject-css** under **Only select repositories**. Keep existing repositories selected. The existing App permissions are sufficient; no new App or key is needed.
2. Under **Secrets and variables → Actions**, ensure `inject-css` is selected for both the organization variable `RENOVATE_APP_CLIENT_ID` and the organization secret `RENOVATE_APP_PRIVATE_KEY`. The workflow creates a short-lived token scoped to this repository only. Renovate does not need an npm publishing token.
3. Merge the setup from `develop` into `main`. Both scheduled runs and the manual workflow entry need the workflow file on the default branch.
4. Run **Update Dependencies** manually and inspect the first PR. Configure the PR check **CI passed** as required for `main` and require an up-to-date branch. Do not give the dependency App a branch-protection bypass.
5. Account for release automation before enforcing branch rules: `release-it` pushes version/changelog commits to `main`, and the sync step writes to `develop`. Rules requiring PRs for all writes need a suitable exception for the release writer; the dependency App is not the release writer.

For another package, repeat the installation and organization-variable/secret access steps, then add its workflow, dependency allowlist, release policy, tests, and documentation. GitHub supports [changing the repositories available to an installed App](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps) and [sharing organization secrets with selected repositories](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## License

By contributing, you agree that your changes will be licensed under the project’s [MIT License](LICENSE.md).
