# @addon-core/inject-css

[![npm version](https://img.shields.io/npm/v/%40addon-core%2Finject-css.svg?logo=npm)](https://www.npmjs.com/package/@addon-core/inject-css)
[![npm downloads](https://img.shields.io/npm/dm/%40addon-core%2Finject-css.svg)](https://www.npmjs.com/package/@addon-core/inject-css)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![CI](https://github.com/addon-stack/inject-css/actions/workflows/ci.yml/badge.svg)](https://github.com/addon-stack/inject-css/actions/workflows/ci.yml)

A lightweight, TypeScript-ready library for injecting CSS into browser extension pages.
Automatically detects Chrome Extension Manifest V2 and V3 and delegates to the appropriate API via [@addon-core/browser](https://github.com/addon-stack/browser). 

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Injecting CSS Code](#injecting-css-code)
    - [Injecting CSS Files](#injecting-css-files)
    - [Updating Options](#updating-options)
- [API](#api)
- [Options](#options)
- [Examples](#examples)
- [License](#license)

## Installation

### npm:

```bash
npm install @addon-core/inject-css
```

### pnpm:

```bash
pnpm add @addon-core/inject-css
```

### yarn:

```bash
yarn add @addon-core/inject-css
```


## Usage

```ts
import injectCss, {InjectCssOptions} from "@addon-core/inject-css";

// Initialize an injector with a target tab ID
const injector = injectCss({tabId: 123});

// Inject raw CSS code into the page
await injector.insert("body { background-color: #f0f0f0; }");

// Inject one or more CSS files (paths relative to extension)
await injector.file("styles/main.css");
await injector.file(["styles/reset.css", "styles/theme.css"]);

// Update options dynamically and reuse the injector
injector.options({frameId: true, origin: "USER"});
await injector.insert("p { color: red; }");
```

### Injecting CSS Code

Use the `insert(css: string)` method to inject raw CSS code.

### Injecting CSS Files

Use the `file(files: string | string[])` method to inject CSS file(s).

### Updating Options

Use the `options(opts: Partial<InjectCssOptions>)` method to merge or override options on an existing injector instance.

## API

### `injectCss(options: InjectCssOptions): InjectCssContract`

Creates a new CSS injector instance. Detects the manifest version (V2 or V3) via `@addon-core/browser` and delegates to the appropriate implementation.

#### `InjectCssContract`

- `insert(css: string): Promise<void>` — Inject raw CSS code.
- `file(files: string | string[]): Promise<void>` — Inject one or more CSS files.
- `options(opts: Partial<InjectCssOptions>): this` — Update injector options.

## Options

The injector accepts the following options (passed to `injectCss(options)` and/or `injector.options(opts)`):

| Option          | Type                                                  | Description                                                                                  |
| --------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| tabId           | number                                                | Required. Target browser tab ID.                                                             |
| frameId         | boolean \| number \| number[]                         | Optional. Select frames to inject into: `true` for all frames; number or array for specific. |
| matchAboutBlank | boolean                                               | Optional. (V2 only) Include `about:blank` and similar subframes. Defaults to `true`.         |
| runAt           | 'document_start' \| 'document_end' \| 'document_idle' | Optional. (V2 only) Injection timing, matches Chrome's `runAt` in `insertCSS`.               |
| documentId      | string \| string[]                                    | Optional. (V3 only) Document IDs for scripting targets.                                      |
| origin          | 'AUTHOR' \| 'USER'                                    | Optional. CSS origin matching Chrome's API (`cssOrigin` in V2, `origin` in V3).              |

## Examples

```ts
import injectCss from "@addon-core/inject-css";

// Initialize with a mix of options
const injector = injectCss({
    tabId: 123,
    frameId: [1, 2], // (V2 & V3)
    runAt: "document_end", // (V2 only)
    documentId: "main-doc-id", // (V3 only)
    origin: "AUTHOR", // 'AUTHOR' or 'USER'
});

// Inject raw CSS code
await injector.insert("body { background-color: #fafafa; }");

// Inject one or more CSS files
await injector.file(["styles/reset.css", "styles/theme.css"]);
```


## License

MIT © Addon Stack
