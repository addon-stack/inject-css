# @adnbn/inject-css

[![npm version](https://img.shields.io/npm/v/@adnbn/inject-css.svg)](https://www.npmjs.com/package/@adnbn/inject-css)
[![npm downloads](https://img.shields.io/npm/dm/@adnbn/inject-css.svg)](https://www.npmjs.com/package/@adnbn/inject-css)

A lightweight, TypeScript-ready library for injecting CSS into browser extension pages.
Automatically detects Chrome Extension Manifest V2 and V3 and delegates to the appropriate API.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Injecting CSS Code](#injecting-css-code)
    - [Injecting CSS Files](#injecting-css-files)
    - [Updating Options](#updating-options)
- [API](#api)
- [Options](#options)
- [Examples](#examples)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation

Using npm:

```bash
npm install @adnbn/inject-css
```

Using Yarn:

```bash
yarn add @adnbn/inject-css
```

## Usage

```ts
import injectCss, {InjectCssOptions} from "@adnbn/inject-css";

// Initialize an injector with a target tab ID
const injector = injectCss({tabId: 123});

// Inject raw CSS code into the page
await injector.insert("body { background-color: #f0f0f0; }");

// Inject one or more CSS files (paths relative to extension)
await injector.file("styles/main.css");
await injector.file(["styles/reset.css", "styles/theme.css"]);

// Update options dynamically and reuse the injector
injector.options({frameId: true, origin: "user"});
await injector.run("p { color: red; }");
```

### Injecting CSS Code

Use the `insert(css: string)` method to inject raw CSS code.

### Injecting CSS Files

Use the `file(files: string | string[])` method to inject CSS file(s).

### Updating Options

Use the `options(opts: Partial<InjectCssOptions>)` method to merge or override options on an existing injector instance.

## API

### `injectCss(options: InjectCssOptions): InjectCssContract`

Creates a new CSS injector instance. Detects the manifest version (V2 or V3) via `@adnbn/browser` and delegates to the appropriate implementation.

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
| origin          | 'author' \| 'user'                                    | Optional. CSS origin matching Chrome's API (`cssOrigin` in V2, `origin` in V3).              |

## Examples

```ts
import injectCss from "@adnbn/inject-css";

// Initialize with a mix of options
const injector = injectCss({
    tabId: 123,
    frameId: [1, 2], // (V2 & V3)
    runAt: "document_end", // (V2 only)
    documentId: "main-doc-id", // (V3 only)
    origin: "author", // 'author' or 'user'
});

// Inject raw CSS code
await injector.insert("body { background-color: #fafafa; }");

// Inject one or more CSS files
await injector.file(["styles/reset.css", "styles/theme.css"]);
```

## Development

### Build

```bash
npm run build
```

### Watch

```bash
npm run build:watch
```

### Format

```bash
npm run format
```

## Contributing

Contributions, issues, and feature requests are welcome!
Please see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for more information.

## License

MIT © Addon Bone
