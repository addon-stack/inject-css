# Changelog

## 🚀 Release `@addon-core/inject-css` v0.4.0 (2026-09-01)

### 💥 Breaking Changes

* InjectCssOptions now requires a nested target.

Legacy flat target fields are replaced by allFrames, frameIds, and documentIds selectors.

Target changes now use target(). Empty file arrays are rejected. Native defaults stay omitted.


### ✨ Features

* add CSS removal support ([6ea2a06](https://github.com/addon-stack/inject-css/commit/6ea2a06234a94ff19a1cc31bb8a743114bd78184))


* align CSS injection contract across MV2 and MV3 ([7802515](https://github.com/addon-stack/inject-css/commit/7802515336077bf24fc34d8d21af324dfdb746d6))


* make execution option resets explicit ([a3d2722](https://github.com/addon-stack/inject-css/commit/a3d2722096966088c25939cbac7c6af8d8a9b521))




### 🏗️ Build System

* align validation and release tooling with inject-script ([bad2749](https://github.com/addon-stack/inject-css/commit/bad2749b209ff23ef5c6b7cdae3c6df422e8bd68))


* repair npm lockfile ([84aa60a](https://github.com/addon-stack/inject-css/commit/84aa60a9b48b798a26dadbd642a3a927b494216c))




### 🐛 Bug Fixed

* improve MV2 CSS delivery diagnostics ([5cc9bcb](https://github.com/addon-stack/inject-css/commit/5cc9bcb51235b4bf2469180c29ca4abcada1c542))


* normalize nested CSS delivery errors ([785b546](https://github.com/addon-stack/inject-css/commit/785b546039cf81566411c9b2672df44302955f63))




### 📝 Documentation

* explain the cross-manifest CSS injection contract ([141a9e6](https://github.com/addon-stack/inject-css/commit/141a9e6115979895eec5e466b7f96443b1bf1b03))


* remove obsolete migration guide ([ee1f478](https://github.com/addon-stack/inject-css/commit/ee1f478afb4ea0b122720729394489b94b683558))




### 🤖 CI

* **release:** update Node.js version, improve npm setup, and refine release configs ([e4d2cc0](https://github.com/addon-stack/inject-css/commit/e4d2cc0273586f21b349bfa5704135caca6d9b94))




### 🧹 Chores

* update package author metadata ([6bd7432](https://github.com/addon-stack/inject-css/commit/6bd74322d755ef6c4ce5fffec1f47686540e7f29))




### 🛠️ Refactoring

* consolidate native CSS delivery handling ([b500738](https://github.com/addon-stack/inject-css/commit/b5007386dc81bde61e19e5476b5fa5330d69bf8b))





### 🙌 Contributors

- [Anjey Tsibylskij](https://github.com/atldays) (@atldays) — 13 commits

## 🚀 Release `@addon-core/inject-css` v0.3.1 (2025-10-21)


### 🐛 Bug Fixed

* handle exceptions when checking for Firefox compatibility ([62ebedc](https://github.com/addon-stack/inject-css/commit/62ebedc5f9f26b3411d65a87e17520f41553e47c))





### 🙌 Contributors

- [Addon Stack](https://github.com/addon-stack) (@addon-stack) — 2 commits
- [Rostyslav Nihrutsa](rostyslav.nihrutsa@gmail.com) — 1 commits

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
