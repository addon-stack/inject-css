# Changelog

## 🚀 Release `@addon-core/inject-css` v0.3.0 (2025-10-15)


### ✨ Features

* add Husky hooks and configure Biome tooling ([426e9fe](https://github.com/addon-stack/inject-css/commit/426e9fe4f8e625980ab20a2057fd3943748d736f))


* improve build configuration and update dependencies ([da49d7e](https://github.com/addon-stack/inject-css/commit/da49d7e55c5f692bf1086b7382fff0de7977be5e))

  - Split `tsup` configuration into separate ESM and CJS builds for improved flexibility.
  - Updated package name and dependencies from `@adnbn` to `@addon-core` for consistency.
  - Added `.mailmap` for contributor alias management.
  - Updated metadata and links in `package.json`.

* update devDependencies and bump @addon-core/browser to v0.2.3 ([3694138](https://github.com/addon-stack/inject-css/commit/3694138c2f94d6410d453560a15d638f81e38dc8))




### 📝 Documentation

* revise CONTRIBUTING.md for @addon-core/inject-css ([954fd63](https://github.com/addon-stack/inject-css/commit/954fd63024051faa1d9f8ac0dca2ece74bb513c8))


* update README and metadata for package rename to @addon-core/inject-css ([998d98e](https://github.com/addon-stack/inject-css/commit/998d98e746b9fe0898361e0c9a2cd87704a9b3e2))




### 🤖 CI

* add release automation and CI workflows ([e97aa12](https://github.com/addon-stack/inject-css/commit/e97aa125f59cf9abd530f577f457b3e5216d4431))




### 🛠️ Refactoring

* simplify InjectCss classes and improve type usage ([15918b9](https://github.com/addon-stack/inject-css/commit/15918b969f7167fd13596827b12ecf4a56e42997))

  - Removed redundant constructors in `InjectCssV2` and `InjectCssV3`.
  - Refactored `target` resolution logic in `InjectCssV3` to handle browser-specific cases.
  - Changed `InjectCssContract` and `InjectCssOptions` imports to use `type` for clarity.
  - Adjusted exports in `index.ts` for cleaner declaration.




### 🙌 Contributors

- [Addon Stack](https://github.com/addon-stack) (@addon-stack) — 10 commits
