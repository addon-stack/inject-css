# @addon-core/inject-css

[![npm version](https://img.shields.io/npm/v/%40addon-core%2Finject-css.svg?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/@addon-core/inject-css)
[![npm downloads](https://img.shields.io/npm/dm/%40addon-core%2Finject-css.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@addon-core/inject-css)
[![CI](https://img.shields.io/github/actions/workflow/status/addon-stack/inject-css/ci.yml?style=for-the-badge)](https://github.com/addon-stack/inject-css/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE.md)

Insert and remove CSS code or extension stylesheets in browser tabs with one typed API for Manifest V2 and Manifest V3.

`@addon-core/inject-css` selects the correct native adapter, validates the target before delivery, and keeps unsupported browser behavior explicit.

- One target model for the top frame, all frames, selected frames, or selected documents
- Runtime validation that matches the TypeScript contract
- Ordered stylesheet injection
- Matching stylesheet removal where the browser exposes a native removal API
- Stable package errors for invalid, unsupported, failed, and timed-out operations
- No silent selector fallback and no extra frame-enumeration permissions

## Install

```bash
npm install @addon-core/inject-css
```

```bash
pnpm add @addon-core/inject-css
```

Your extension still needs the native permissions required for CSS injection, including `scripting` in MV3 and appropriate host or `activeTab` access. The package does not modify the manifest.

## Quick start

```ts
import injectCss from "@addon-core/inject-css";

const injector = injectCss({
  target: {tabId: 123},
});

await injector.insert("body { background: #f5f5f5; }");

// The source, target, and origin match the insertion.
await injector.remove("body { background: #f5f5f5; }");
```

The package detects the current manifest version automatically. Insertion uses `tabs.insertCSS` in MV2 and `scripting.insertCSS` in MV3; removal uses the matching native removal API when available.

## Choose what to target

Every injector has exactly one target. Selectors are mutually exclusive in TypeScript and validated again at runtime.

| Need | Target |
| --- | --- |
| Main frame | `{tabId: 123}` |
| Every injectable frame | `{tabId: 123, allFrames: true}` |
| One frame | `{tabId: 123, frameIds: [7]}` |
| Selected frames | `{tabId: 123, frameIds: [0, 7, 12]}` |
| Selected documents | `{tabId: 123, documentIds: ["document-a", "document-b"]}` |

```ts
const topFrame = injectCss({
  target: {tabId: 123},
});

const selectedFrames = injectCss({
  target: {tabId: 123, frameIds: [0, 7]},
});

const allFrames = injectCss({
  target: {tabId: 123, allFrames: true},
});
```

`allFrames` accepts only the literal `true`. Omitting a selector means the top frame; there is no `allFrames: false` mode.

`documentIds` require an MV3 runtime with native document targeting. An unsupported target throws `UnsupportedInjectCssTargetError`; the package never drops `documentIds` or falls back to a broader target.

`allFrames` remains one native browser operation. The package does not enumerate frames or promise an exhaustive frame snapshot.

## Insert CSS code

```ts
await injector.insert(`
  html {
    color-scheme: dark;
  }

  body {
    background: #111;
    color: #eee;
  }
`);
```

The CSS source must be a non-empty string.

## Insert CSS files

```ts
await injector.file("styles/content.css");

await injector.file([
  "styles/reset.css",
  "styles/theme.css",
]);
```

File lists must be non-empty and every path must be a non-empty string. Files are injected in the provided order. In MV2, one file completes for the requested target before the next file starts, preserving CSS cascade order.

## Remove CSS

Remove CSS code with `remove()` and extension stylesheets with `removeFile()`:

```ts
await injector.remove("body { background: #f5f5f5; }");

await injector.removeFile("styles/content.css");

await injector.removeFile([
  "styles/reset.css",
  "styles/theme.css",
]);
```

Removal uses the injector's current target and origin. The CSS source, file list, target, and origin must match the values used for insertion. Removing a stylesheet that is not present is a native no-op.

MV3 uses `scripting.removeCSS`. MV2 uses `tabs.removeCSS` only when the current browser exposes it; otherwise removal rejects with `UnsupportedInjectCssOperationError`. This capability is checked when removal is requested, so insertion remains available in MV2 browsers without `tabs.removeCSS`.

MV2 removes multiple files sequentially in the provided order, matching its insertion behavior. `runAt` affects insertion only because the MV2 removal API has no corresponding field.

## Reuse an injector

Replace the complete target with `target()`:

```ts
injector
  .target({tabId: 123, frameIds: [7]})
  .target({tabId: 123, allFrames: true});
```

The second call replaces the previous selector instead of merging with it. A validation failure leaves the existing target unchanged.

Update only execution options with `options()`:

```ts
injector.options({
  origin: "USER",
  timeoutMs: 8_000,
});
```

`options()` never accepts or changes a target. Passing an explicit `undefined` resets that option instead of retaining its previous value:

```ts
injector.options({
  origin: undefined,
  timeoutMs: undefined,
});
```

The next operation then uses the native origin default and the package's default timeout.

## Execution options

The portable baseline is to omit adapter-specific options:

```ts
const injector = injectCss({
  target: {tabId: 123},
  origin: "AUTHOR",
  timeoutMs: 5_000,
});
```

| Option | MV2 | MV3 |
| --- | --- | --- |
| `origin` | Mapped to `author` or `user` | Passed as `AUTHOR` or `USER` |
| `timeoutMs` | Supported; default `4_000` ms | Supported; default `4_000` ms |
| `matchAboutBlank` | Passed only when explicitly set | Rejected; no native equivalent |
| `runAt` | Passed to `tabs.insertCSS` | Rejected; no native equivalent |

When `matchAboutBlank` is omitted, the package preserves the native default instead of forcing it to `true`.

Explicit unsupported options throw `UnsupportedInjectCssOptionError`. They are never ignored silently.

## Handle failures

```ts
import {InjectCssBaseError} from "@addon-core/inject-css";

try {
  await injector.file("styles/content.css");
} catch (error) {
  if (error instanceof InjectCssBaseError) {
    console.error(error.code, error.message, error.cause);
  } else {
    throw error;
  }
}
```

Every rejected package operation exposes an error derived from `InjectCssBaseError` with a stable `code`. Delivery and timeout errors also retain the request target and expose `operation` as `"insert"` or `"remove"`. For explicit MV2 frame targets, a delivery error may contain an `InjectCssFrameDeliveryError` cause with code `ERR_INJECT_CSS_FRAME_DELIVERY`, the failed `tabId`, `frameId`, operation, and native cause. Prefer `code` when errors may cross realms or multiple copies of the dependency may exist.

Known validation and adapter incompatibilities fail before delivery. Browser capabilities discovered only by a native call are normalized after that call.

### What `Promise<void>` means

Native CSS injection and removal APIs do not provide a portable per-frame result. `insert()`, `file()`, `remove()`, and `removeFile()` therefore resolve with no value.

A resolved promise means the native operation completed. It does not prove that CSS was inserted or removed in every requested frame. A rejected multi-target operation is not transactional: some targets or earlier files may already have completed the requested change.

In MV2, a timeout stops the package from starting later files in a sequential insertion or removal batch. In MV3, the complete file list is handed to the browser in one native call before a timeout can occur. In either adapter, a timeout cannot cancel a native browser operation that is already in progress.

## Migrating from 0.3.x

Targets now live under the required `target` field:

```ts
// Before
const injector = injectCss({
  tabId: 123,
  frameId: [1, 2],
  origin: "USER",
});

injector.options({frameId: true});

// Now
const injector = injectCss({
  target: {tabId: 123, frameIds: [1, 2]},
  origin: "USER",
});

injector.target({tabId: 123, allFrames: true});
```

Migration map:

- `{tabId}` becomes `{target: {tabId}}`.
- `frameId: false` becomes a top-frame target with no selector.
- `frameId: 7` becomes `frameIds: [7]`.
- `frameId: [2, 7]` becomes `frameIds: [2, 7]`.
- `documentId: "document-a"` becomes `documentIds: ["document-a"]`.
- Target changes move from `.options()` to `.target()`.
- `file([])` is now a compile-time and runtime error.
- Code relying on the old implicit `matchAboutBlank: true` must set it explicitly in MV2.

## API reference

The factory is available as both a default and named export:

```ts
import injectCss from "@addon-core/inject-css";
import {injectCss} from "@addon-core/inject-css";
```

```ts
interface InjectCssContract {
  insert(css: string): Promise<void>;
  file(files: string | NonEmptyReadonlyArray<string>): Promise<void>;
  remove(css: string): Promise<void>;
  removeFile(files: string | NonEmptyReadonlyArray<string>): Promise<void>;
  target(target: InjectCssTarget): this;
  options(options: InjectCssExecutionOptionsPatch): this;
}
```

Runtime exports:

```text
injectCss
InjectCssBaseError
InjectCssDeliveryError
InjectCssFrameDeliveryError
InjectCssTimeoutError
InvalidInjectCssCodeError
InvalidInjectCssFilesError
InvalidInjectCssOptionsError
InvalidInjectCssTargetError
UnsupportedInjectCssOptionError
UnsupportedInjectCssOperationError
UnsupportedInjectCssTargetError
```

Core type exports:

```text
InjectCssContract
InjectCssOptions
InjectCssExecutionOptions
InjectCssExecutionOptionsPatch
InjectCssOperation
InjectCssOrigin
InjectCssTarget
InjectCssTopFrameTarget
InjectCssAllFramesTarget
InjectCssFramesTarget
InjectCssDocumentsTarget
InjectCssErrorCode
NonEmptyReadonlyArray
```

## Design boundaries

The package focuses on portable programmatic CSS insertion and removal. It does not enumerate frames, discover document IDs, track which stylesheets were inserted, aggregate application-specific per-frame results, or claim atomic delivery across targets.

Callers remain responsible for retaining the exact source, target, and origin needed for later removal.

## License

[MIT](LICENSE.md)
