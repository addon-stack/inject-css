const {
    default: injectCss,
    injectCss: namedInjectCss,
    InjectCssBaseError,
    InjectCssDeliveryError,
    InjectCssFrameDeliveryError,
    InjectCssTimeoutError,
    InvalidInjectCssCodeError,
    InvalidInjectCssFilesError,
    InvalidInjectCssOptionsError,
    InvalidInjectCssTargetError,
    UnsupportedInjectCssOptionError,
    UnsupportedInjectCssOperationError,
    UnsupportedInjectCssTargetError,
} = require("../dist/index.cjs");

const createRuntime = manifestVersion => ({
    id: "test-extension",
    lastError: undefined,
    getManifest: () => ({manifest_version: manifestVersion}),
});

const flushAsync = () => new Promise(resolve => setImmediate(resolve));

describe("package exports", () => {
    test("exports the factory as both default and named", () => {
        expect(namedInjectCss).toBe(injectCss);
    });
});

describe("InjectCss target and execution options", () => {
    afterEach(() => {
        delete global.chrome;
        delete global.browser;
    });

    test.each([
        [{target: {tabId: -1}}, '"tabId" must be a non-negative integer'],
        [{target: {tabId: 1, allFrames: false}}, '"allFrames" must be exactly true'],
        [{target: {tabId: 1, frameIds: []}}, '"frameIds" must contain at least one'],
        [{target: {tabId: 1, frameIds: [1, 1]}}, '"frameIds" must not contain duplicate'],
        [{target: {tabId: 1, frameIds: [1.5]}}, "frame ID must be a non-negative integer"],
        [{target: {tabId: 1, documentIds: []}}, '"documentIds" must contain at least one'],
        [{target: {tabId: 1, documentIds: [""]}}, "document ID must be a non-empty string"],
        [{target: {tabId: 1, documentIds: ["doc", "doc"]}}, '"documentIds" must not contain duplicate'],
        [
            {target: {tabId: 1, allFrames: true, frameIds: [1]}},
            '"allFrames", "frameIds", and "documentIds" are mutually exclusive',
        ],
        [{target: {tabId: 1, frameId: 2}}, 'unknown field: "frameId"'],
    ])("rejects invalid target %#", (options, message) => {
        global.chrome = {runtime: createRuntime(3)};

        expect(() => injectCss(options)).toThrow(InvalidInjectCssTargetError);
        expect(() => injectCss(options)).toThrow(message);

        try {
            injectCss(options);
        } catch (error) {
            expect(error).toBeInstanceOf(InjectCssBaseError);
            expect(error.code).toBe("ERR_INJECT_CSS_INVALID_TARGET");
        }
    });

    test.each([
        [{timeoutMs: 0}, '"timeoutMs" must be a positive integer'],
        [{timeoutMs: 1.5}, '"timeoutMs" must be a positive integer'],
        [{matchAboutBlank: "yes"}, '"matchAboutBlank" must be a boolean'],
        [{runAt: "immediately"}, '"runAt" must be'],
        [{origin: "author"}, '"origin" must be "AUTHOR" or "USER"'],
        [{unexpected: true}, 'unknown field: "unexpected"'],
    ])("rejects invalid execution options %#", (execution, message) => {
        global.chrome = {runtime: createRuntime(3)};

        expect(() => injectCss({target: {tabId: 1}, ...execution})).toThrow(InvalidInjectCssOptionsError);
        expect(() => injectCss({target: {tabId: 1}, ...execution})).toThrow(message);

        try {
            injectCss({target: {tabId: 1}, ...execution});
        } catch (error) {
            expect(error).toBeInstanceOf(InjectCssBaseError);
            expect(error.code).toBe("ERR_INJECT_CSS_INVALID_OPTIONS");
        }
    });

    test.each(["", "   ", 42, null])("rejects invalid CSS code %# before native injection", async css => {
        const insertCSS = jest.fn((_details, callback) => callback());
        global.chrome = {runtime: createRuntime(3), scripting: {insertCSS}};

        const rejection = injectCss({target: {tabId: 1}})
            .insert(css)
            .catch(error => error);
        const error = await rejection;

        expect(error).toBeInstanceOf(InvalidInjectCssCodeError);
        expect(error).toBeInstanceOf(InjectCssBaseError);
        expect(error.code).toBe("ERR_INJECT_CSS_INVALID_CODE");
        expect(insertCSS).not.toHaveBeenCalled();
    });

    test.each([[[]], [["/valid.css", " "]], [""], ["  "], [42]])(
        "rejects invalid CSS files %# before native injection",
        async files => {
            const insertCSS = jest.fn((_details, callback) => callback());
            global.chrome = {runtime: createRuntime(3), scripting: {insertCSS}};

            const error = await injectCss({target: {tabId: 1}})
                .file(files)
                .catch(cause => cause);

            expect(error).toBeInstanceOf(InvalidInjectCssFilesError);
            expect(error).toBeInstanceOf(InjectCssBaseError);
            expect(error.code).toBe("ERR_INJECT_CSS_INVALID_FILES");
            expect(insertCSS).not.toHaveBeenCalled();
        }
    );

    test("validates removal sources before checking native removal support", async () => {
        global.chrome = {runtime: createRuntime(3), scripting: {}};
        const injector = injectCss({target: {tabId: 1}});

        await expect(injector.remove(" ")).rejects.toBeInstanceOf(InvalidInjectCssCodeError);
        await expect(injector.removeFile([])).rejects.toBeInstanceOf(InvalidInjectCssFilesError);
    });

    test("copies target arrays instead of retaining caller-owned state", async () => {
        const calls = [];
        const frameIds = [1];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        const injector = injectCss({target: {tabId: 4, frameIds}});
        frameIds.push(2);

        await injector.insert("body { color: red; }");

        expect(calls[0].target).toEqual({tabId: 4, frameIds: [1]});
    });

    test("atomically replaces targets and prevents options() from mutating them", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        const injector = injectCss({target: {tabId: 4, frameIds: [2]}});

        expect(() => injector.target({tabId: 4, frameIds: []})).toThrow(InvalidInjectCssTargetError);
        expect(() => injector.options({target: {tabId: 9}})).toThrow(InvalidInjectCssOptionsError);
        expect(injector.options({origin: "AUTHOR"})).toBe(injector);

        await injector.file("/content.css");

        expect(calls[0].target).toEqual({tabId: 4, frameIds: [2]});
    });
});

describe("MV3 adapter", () => {
    afterEach(() => {
        delete global.chrome;
        delete global.browser;
        jest.useRealTimers();
    });

    test.each([
        [{tabId: 7}, {tabId: 7}],
        [
            {tabId: 7, allFrames: true},
            {tabId: 7, allFrames: true},
        ],
        [
            {tabId: 7, frameIds: [0, 2]},
            {tabId: 7, frameIds: [0, 2]},
        ],
        [
            {tabId: 7, documentIds: ["doc-a", "doc-b"]},
            {tabId: 7, documentIds: ["doc-a", "doc-b"]},
        ],
    ])("maps target %# to one native CSS injection", async (target, nativeTarget) => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await expect(injectCss({target}).insert("body { color: red; }")).resolves.toBeUndefined();

        expect(calls).toEqual([{target: nativeTarget, css: "body { color: red; }"}]);
    });

    test("supports Promise-based MV3 delivery through the browser namespace", async () => {
        const calls = [];

        global.browser = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: details => {
                    calls.push(details);
                    return Promise.resolve();
                },
            },
        };

        await expect(injectCss({target: {tabId: 12}}).file("/content.css")).resolves.toBeUndefined();
        expect(calls).toEqual([{target: {tabId: 12}, files: ["/content.css"]}]);
    });

    test("passes ordered files as a native batch and preserves canonical origin", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await expect(
            injectCss({target: {tabId: 7}, origin: "USER"}).file(["/first.css", "/second.css"])
        ).resolves.toBeUndefined();

        expect(calls).toEqual([
            {
                target: {tabId: 7},
                files: ["/first.css", "/second.css"],
                origin: "USER",
            },
        ]);
    });

    test("removes code and ordered files with the exact MV3 source, target, and origin", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                removeCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        const injector = injectCss({target: {tabId: 7, documentIds: ["doc"]}, origin: "USER"});

        await expect(injector.remove("body { color: red; }")).resolves.toBeUndefined();
        await expect(injector.removeFile(["/first.css", "/second.css"])).resolves.toBeUndefined();

        expect(calls).toEqual([
            {
                target: {tabId: 7, documentIds: ["doc"]},
                css: "body { color: red; }",
                origin: "USER",
            },
            {
                target: {tabId: 7, documentIds: ["doc"]},
                files: ["/first.css", "/second.css"],
                origin: "USER",
            },
        ]);
    });

    test("reports missing MV3 removal capability with a typed operation error", async () => {
        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (_details, callback) => callback(),
            },
        };

        const injector = injectCss({target: {tabId: 7}});

        await expect(injector.insert("body { color: red; }")).resolves.toBeUndefined();

        const error = await injector.remove("body { color: red; }").catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOperationError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPERATION",
            operation: "remove",
        });
    });

    test("normalizes a native MV3 removal capability error", async () => {
        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                removeCSS: (_details, callback) => {
                    global.chrome.runtime.lastError = {message: "scripting.removeCSS is not supported"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target: {tabId: 7}})
            .removeFile("/content.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOperationError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPERATION",
            operation: "remove",
            cause: expect.any(Error),
        });
    });

    test("reports MV3 removal delivery failures with the operation", async () => {
        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                removeCSS: (_details, callback) => {
                    global.chrome.runtime.lastError = {message: "Missing host permission"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const target = {tabId: 7, frameIds: [2]};
        const error = await injectCss({target})
            .remove("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_DELIVERY",
            target,
            operation: "remove",
            cause: expect.any(Error),
        });
        expect(error.message).toContain("CSS removal failed");
    });

    test("reports MV3 removal timeouts with the operation", async () => {
        jest.useFakeTimers();

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                removeCSS: () => {},
            },
        };

        const target = {tabId: 7, allFrames: true};
        const pending = injectCss({target, timeoutMs: 5})
            .removeFile("/content.css")
            .catch(cause => cause);

        jest.advanceTimersByTime(5);
        const error = await pending;

        expect(error).toBeInstanceOf(InjectCssTimeoutError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_TIMEOUT",
            target,
            timeoutMs: 5,
            operation: "remove",
        });
        expect(error.message).toContain("CSS removal timed out");
    });

    test("does not materialize an omitted origin", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await injectCss({target: {tabId: 7}}).file("/content.css");

        expect(calls[0]).not.toHaveProperty("origin");
    });

    test.each([
        [{matchAboutBlank: false}, '"matchAboutBlank" is not supported'],
        [{matchAboutBlank: true}, '"matchAboutBlank" is not supported'],
        [{runAt: "document_start"}, '"runAt" is not supported'],
        [{runAt: "document_end"}, '"runAt" is not supported'],
        [{runAt: "document_idle"}, '"runAt" is not supported'],
    ])("rejects unsupported execution option %# before native injection", (execution, message) => {
        const insertCSS = jest.fn();
        global.chrome = {runtime: createRuntime(3), scripting: {insertCSS}};

        expect(() => injectCss({target: {tabId: 1}, ...execution})).toThrow(UnsupportedInjectCssOptionError);
        expect(() => injectCss({target: {tabId: 1}, ...execution})).toThrow(message);

        try {
            injectCss({target: {tabId: 1}, ...execution});
        } catch (error) {
            expect(error.code).toBe("ERR_INJECT_CSS_UNSUPPORTED_OPTION");
        }

        expect(insertCSS).not.toHaveBeenCalled();
    });

    test("passes document targets directly without browser-name fallback", async () => {
        const calls = [];
        const runtime = {...createRuntime(3), getBrowserInfo: () => Promise.resolve({name: "Firefox"})};

        global.chrome = {
            runtime,
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await injectCss({target: {tabId: 7, documentIds: ["doc"]}}).file("/content.css");

        expect(calls[0].target).toEqual({tabId: 7, documentIds: ["doc"]});
    });

    test("normalizes a native documentIds capability error without falling back", async () => {
        const runtime = createRuntime(3);
        const calls = [];

        global.chrome = {
            runtime,
            scripting: {
                insertCSS: (details, callback) => {
                    calls.push(details);
                    global.chrome.runtime.lastError = {message: 'Unexpected property "documentIds"'};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target: {tabId: 2, documentIds: ["doc"]}})
            .file("/file.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssTargetError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_TARGET",
            cause: expect.any(Error),
        });
        expect(calls).toHaveLength(1);
        expect(calls[0].target).toEqual({tabId: 2, documentIds: ["doc"]});
    });

    test("keeps a stale documentId failure classified as a delivery error", async () => {
        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: (_details, callback) => {
                    global.chrome.runtime.lastError = {message: "Invalid documentId: stale-doc"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const target = {tabId: 2, documentIds: ["stale-doc"]};
        const error = await injectCss({target})
            .file("/file.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error).not.toBeInstanceOf(UnsupportedInjectCssTargetError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_DELIVERY",
            target,
            cause: expect.any(Error),
        });
    });

    test("normalizes a native origin capability error", async () => {
        const runtime = createRuntime(3);

        global.chrome = {
            runtime,
            scripting: {
                insertCSS: (_details, callback) => {
                    global.chrome.runtime.lastError = {message: 'Unexpected property "origin"'};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target: {tabId: 2}, origin: "USER"})
            .insert("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOptionError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPTION",
            cause: expect.any(Error),
        });
    });

    test("reports native delivery failures with the target and cause", async () => {
        const runtime = createRuntime(3);
        const target = {tabId: 2, frameIds: [0, 3]};

        global.chrome = {
            runtime,
            scripting: {
                insertCSS: (_details, callback) => {
                    global.chrome.runtime.lastError = {message: "Missing host permission"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target})
            .insert("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error).toBeInstanceOf(InjectCssBaseError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_DELIVERY",
            target,
            cause: expect.any(Error),
        });
        expect(error.cause.message).toBe("Missing host permission");
    });

    test("reports timeouts with the target and configured timeout", async () => {
        jest.useFakeTimers();

        global.chrome = {
            runtime: createRuntime(3),
            scripting: {
                insertCSS: () => {},
            },
        };

        const target = {tabId: 2, allFrames: true};
        const pending = injectCss({target, timeoutMs: 5})
            .file("/file.css")
            .catch(error => error);

        jest.advanceTimersByTime(5);
        const error = await pending;

        expect(error).toBeInstanceOf(InjectCssTimeoutError);
        expect(error).toBeInstanceOf(InjectCssBaseError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_TIMEOUT",
            target,
            timeoutMs: 5,
        });
    });
});

describe("MV2 adapter", () => {
    afterEach(() => {
        delete global.chrome;
        delete global.browser;
        jest.useRealTimers();
    });

    test.each([
        [{tabId: 7}, [{tabId: 7, details: {code: "body { color: red; }"}}]],
        [{tabId: 7, allFrames: true}, [{tabId: 7, details: {code: "body { color: red; }", allFrames: true}}]],
        [
            {tabId: 7, frameIds: [0, 2]},
            [
                {tabId: 7, details: {code: "body { color: red; }", frameId: 0}},
                {tabId: 7, details: {code: "body { color: red; }", frameId: 2}},
            ],
        ],
    ])("maps target %# to tabs.insertCSS calls", async (target, expectedCalls) => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (tabId, details, callback) => {
                    calls.push({tabId, details});
                    callback();
                },
            },
        };

        await expect(injectCss({target}).insert("body { color: red; }")).resolves.toBeUndefined();

        expect(calls).toEqual(expectedCalls);
    });

    test("supports Promise-based MV2 delivery through the browser namespace", async () => {
        const calls = [];

        global.browser = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (tabId, details) => {
                    calls.push({tabId, details});
                    return Promise.resolve();
                },
            },
        };

        await expect(injectCss({target: {tabId: 12}}).insert("body { color: red; }")).resolves.toBeUndefined();
        expect(calls).toEqual([{tabId: 12, details: {code: "body { color: red; }"}}]);
    });

    test("removes MV2 code from explicit frames without forwarding runAt", async () => {
        const calls = [];

        global.browser = {
            runtime: createRuntime(2),
            tabs: {
                removeCSS: (tabId, details) => {
                    calls.push({tabId, details});
                    return Promise.resolve();
                },
            },
        };

        await expect(
            injectCss({
                target: {tabId: 12, frameIds: [0, 3]},
                origin: "USER",
                matchAboutBlank: true,
                runAt: "document_start",
            }).remove("body { color: red; }")
        ).resolves.toBeUndefined();

        expect(calls).toEqual([
            {
                tabId: 12,
                details: {
                    code: "body { color: red; }",
                    cssOrigin: "user",
                    matchAboutBlank: true,
                    frameId: 0,
                },
            },
            {
                tabId: 12,
                details: {
                    code: "body { color: red; }",
                    cssOrigin: "user",
                    matchAboutBlank: true,
                    frameId: 3,
                },
            },
        ]);
    });

    test("reports missing MV2 removal capability with a typed operation error", async () => {
        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (_tabId, _details, callback) => callback(),
            },
        };

        const error = await injectCss({target: {tabId: 7}})
            .removeFile("/content.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOperationError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPERATION",
            operation: "remove",
        });
    });

    test("normalizes a native MV2 removal capability error", async () => {
        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                removeCSS: (_tabId, _details, callback) => {
                    global.chrome.runtime.lastError = {message: "tabs.removeCSS is not supported"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target: {tabId: 7}})
            .remove("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOperationError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPERATION",
            operation: "remove",
            cause: expect.any(Error),
        });
    });

    test("removes MV2 files sequentially while dispatching each file to frames in parallel", async () => {
        const calls = [];
        const callbacks = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                removeCSS: (tabId, details, callback) => {
                    calls.push({tabId, details});
                    callbacks.push(callback);
                },
            },
        };

        const pending = injectCss({target: {tabId: 6, frameIds: [0, 3]}}).removeFile(["/first.css", "/second.css"]);

        expect(calls.map(call => call.details)).toEqual([
            {file: "/first.css", frameId: 0},
            {file: "/first.css", frameId: 3},
        ]);

        callbacks.splice(0).forEach(callback => {
            callback();
        });
        await flushAsync();

        expect(calls.map(call => call.details)).toEqual([
            {file: "/first.css", frameId: 0},
            {file: "/first.css", frameId: 3},
            {file: "/second.css", frameId: 0},
            {file: "/second.css", frameId: 3},
        ]);

        callbacks.splice(0).forEach(callback => {
            callback();
        });
        await expect(pending).resolves.toBeUndefined();
    });

    test("retains the failed MV2 removal frame and operation", async () => {
        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                removeCSS: (_tabId, details, callback) => {
                    if (details.frameId === 3) {
                        global.chrome.runtime.lastError = {message: "Frame 3 is unavailable"};
                    }

                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const target = {tabId: 2, frameIds: [0, 3]};
        const error = await injectCss({target})
            .removeFile("/content.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_DELIVERY",
            target,
            operation: "remove",
            message: "CSS removal failed in frame 3 of tab 2: Frame 3 is unavailable",
        });
        expect(error.cause).toBeInstanceOf(InjectCssFrameDeliveryError);
        expect(error.cause).toBeInstanceOf(InjectCssBaseError);
        expect(error.cause).toMatchObject({
            code: "ERR_INJECT_CSS_FRAME_DELIVERY",
            tabId: 2,
            frameId: 3,
            operation: "remove",
            cause: expect.objectContaining({message: "Frame 3 is unavailable"}),
        });
    });

    test("maps canonical origin to MV2 casing and preserves supported execution options", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (_tabId, details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await injectCss({
            target: {tabId: 1},
            origin: "USER",
            matchAboutBlank: true,
            runAt: "document_start",
        }).file("/content.css");

        expect(calls[0]).toEqual({
            file: "/content.css",
            cssOrigin: "user",
            matchAboutBlank: true,
            runAt: "document_start",
        });
    });

    test("does not materialize omitted matchAboutBlank, runAt, or origin", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (_tabId, details, callback) => {
                    calls.push(details);
                    callback();
                },
            },
        };

        await injectCss({target: {tabId: 1}}).file("/content.css");

        expect(calls[0]).toEqual({file: "/content.css"});
        expect(calls[0]).not.toHaveProperty("matchAboutBlank");
    });

    test("resets execution options when options() receives explicit undefined values", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (_tabId, details, callback) => {
                    calls.push(details);
                    setTimeout(callback, 10);
                },
            },
        };

        const injector = injectCss({
            target: {tabId: 1},
            origin: "USER",
            matchAboutBlank: true,
            runAt: "document_start",
            timeoutMs: 1,
        });

        injector.options({
            origin: undefined,
            matchAboutBlank: undefined,
            runAt: undefined,
            timeoutMs: undefined,
        });

        await expect(injector.file("/content.css")).resolves.toBeUndefined();
        expect(calls[0]).toEqual({file: "/content.css"});
    });

    test("rejects document targets before native injection and retains the previous target", async () => {
        const calls = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (tabId, details, callback) => {
                    calls.push({tabId, details});
                    callback();
                },
            },
        };

        expect(() => injectCss({target: {tabId: 1, documentIds: ["doc"]}})).toThrow(UnsupportedInjectCssTargetError);

        const injector = injectCss({target: {tabId: 1}});
        expect(() => injector.target({tabId: 9, documentIds: ["doc"]})).toThrow(UnsupportedInjectCssTargetError);

        try {
            injector.target({tabId: 9, documentIds: ["doc"]});
        } catch (error) {
            expect(error.code).toBe("ERR_INJECT_CSS_UNSUPPORTED_TARGET");
        }

        await injector.file("/content.css");

        expect(calls).toEqual([{tabId: 1, details: {file: "/content.css"}}]);
    });

    test("reports native delivery failures with the target and cause", async () => {
        const runtime = createRuntime(2);
        const target = {tabId: 2};

        global.chrome = {
            runtime,
            tabs: {
                insertCSS: (_tabId, _details, callback) => {
                    global.chrome.runtime.lastError = {message: "Missing host permission"};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target})
            .insert("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_DELIVERY",
            target,
            cause: expect.any(Error),
        });
    });

    test("retains the failed frame in the MV2 delivery cause", async () => {
        const runtime = createRuntime(2);
        const target = {tabId: 2, frameIds: [0, 3]};

        global.chrome = {
            runtime,
            tabs: {
                insertCSS: (_tabId, details, callback) => {
                    if (details.frameId === 3) {
                        global.chrome.runtime.lastError = {message: "Frame 3 is unavailable"};
                    }

                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target})
            .insert("body { color: red; }")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(InjectCssDeliveryError);
        expect(error.target).toEqual(target);
        expect(error.message).toBe("CSS injection failed in frame 3 of tab 2: Frame 3 is unavailable");
        expect(error.cause).toBeInstanceOf(InjectCssFrameDeliveryError);
        expect(error.cause).toBeInstanceOf(InjectCssBaseError);
        expect(error.cause).toMatchObject({
            code: "ERR_INJECT_CSS_FRAME_DELIVERY",
            tabId: 2,
            frameId: 3,
            cause: expect.objectContaining({message: "Frame 3 is unavailable"}),
        });
    });

    test("normalizes an MV2 cssOrigin capability error", async () => {
        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (_tabId, _details, callback) => {
                    global.chrome.runtime.lastError = {message: 'Unexpected property "cssOrigin"'};
                    callback();
                    global.chrome.runtime.lastError = undefined;
                },
            },
        };

        const error = await injectCss({target: {tabId: 2}, origin: "USER"})
            .file("/content.css")
            .catch(cause => cause);

        expect(error).toBeInstanceOf(UnsupportedInjectCssOptionError);
        expect(error).toMatchObject({
            code: "ERR_INJECT_CSS_UNSUPPORTED_OPTION",
            cause: expect.any(Error),
        });
    });

    test("injects files sequentially while dispatching each file to frames in parallel", async () => {
        const calls = [];
        const callbacks = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (tabId, details, callback) => {
                    calls.push({tabId, details});
                    callbacks.push(callback);
                },
            },
        };

        const pending = injectCss({target: {tabId: 6, frameIds: [0, 3]}}).file(["/first.css", "/second.css"]);

        expect(calls).toEqual([
            {tabId: 6, details: {file: "/first.css", frameId: 0}},
            {tabId: 6, details: {file: "/first.css", frameId: 3}},
        ]);

        callbacks.shift()();
        await flushAsync();
        expect(calls).toHaveLength(2);

        callbacks.shift()();
        await flushAsync();
        expect(calls).toEqual([
            {tabId: 6, details: {file: "/first.css", frameId: 0}},
            {tabId: 6, details: {file: "/first.css", frameId: 3}},
            {tabId: 6, details: {file: "/second.css", frameId: 0}},
            {tabId: 6, details: {file: "/second.css", frameId: 3}},
        ]);

        callbacks.splice(0).forEach(callback => {
            callback();
        });
        await expect(pending).resolves.toBeUndefined();
    });

    test("does not start a later MV2 file after the operation times out", async () => {
        jest.useFakeTimers();

        const calls = [];
        const callbacks = [];

        global.chrome = {
            runtime: createRuntime(2),
            tabs: {
                insertCSS: (tabId, details, callback) => {
                    calls.push({tabId, details});
                    callbacks.push(callback);
                },
            },
        };

        const target = {tabId: 6, frameIds: [0, 3]};
        const pending = injectCss({target, timeoutMs: 5})
            .file(["/first.css", "/second.css"])
            .catch(error => error);

        expect(calls.map(call => call.details.file)).toEqual(["/first.css", "/first.css"]);

        jest.advanceTimersByTime(5);
        const error = await pending;

        expect(error).toBeInstanceOf(InjectCssTimeoutError);
        expect(error).toMatchObject({target, timeoutMs: 5});

        callbacks.forEach(callback => {
            callback();
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(calls.map(call => call.details.file)).toEqual(["/first.css", "/first.css"]);
    });
});
