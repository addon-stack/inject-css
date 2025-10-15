<!--
  CONTRIBUTING.md
  Guidelines for contributing to the @addon-core/inject-css project.
-->

# Contributing to @addon-core/inject-css

This document outlines the process for contributing, reporting issues, and submitting patches. By participating, you agree to abide by the project’s [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents

1. [Reporting Bugs](#reporting-bugs)
2. [Suggesting Enhancements](#suggesting-enhancements)
3. [Development Setup](#development-setup)
4. [Scripts](#scripts)
5. [Pull Request Workflow](#pull-request-workflow)
6. [Code Style & Quality](#code-style--quality)
7. [Commit Messages](#commit-messages)
8. [Code of Conduct](#code-of-conduct)
9. [License](#license)

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
4. Install dependencies (choose one):
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

## Scripts

The following scripts are available and should be used during development:

- `npm run build` — build the project with tsup
- `npm run build:watch` — build in watch mode
- `npm run format` — format code with Biome
- `npm run format:check` — check formatting only
- `npm run lint` — lint code with Biome
- `npm run lint:fix` — attempt to automatically fix lint issues
- `npm run lint:fix:aggressive` — fix lint issues using unsafe rules
- `npm run typecheck` — run TypeScript type checks
- `npm run test` — run tests with Jest
- `npm run test:ci` — run tests in CI with coverage
- `npm run release` — trigger release via release-it

Note: Husky hooks are configured. On commit, your message is validated with commitlint; on pre-commit, linting/formatting/tests are run.

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
5. Push to your fork and open a Pull Request against the `main` branch.
6. Provide a clear title and description, referencing related issues (e.g., `Closes #123`).

## Code Style & Quality

- Language: TypeScript
- Formatting & Linting: Biome (see `biome.json`)

Please run `npm run format` and `npm run lint` before submitting code. Type safety is enforced via `npm run typecheck`.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Commit messages are validated by commitlint.

Format:
```
<type>[optional scope]: <description>
```

Common types:

- `feat`: a new feature
- `fix`: a bug fix
- `docs`: documentation only changes
- `style`: formatting, missing semicolons, etc
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding missing tests or correcting existing tests
- `chore`: updating build tasks, package manager configs, etc

Example:
```
feat(core): add new API method for X
```

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## License

By contributing, you agree that your changes will be licensed under the project’s [MIT License](LICENSE.md).
