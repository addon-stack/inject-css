const createReleaseConfig = require("../.release-it.cjs");
const {whatBump} = createReleaseConfig;

describe("release-it version policy", () => {
    describe("breaking changes", () => {
        test.each([
            ["parser breaking field", {type: "feat", breaking: "!"}],
            ["type suffix", {type: "feat!"}],
            ["header suffix", {type: "feat", header: "feat(inject-css)!: remove legacy API"}],
            ["BREAKING CHANGE note", {type: "fix", notes: [{title: "BREAKING CHANGE", text: "new contract"}]}],
            ["BREAKING-CHANGE footer", {type: "fix", footer: "BREAKING-CHANGE: new contract"}],
        ])("treats %s as a pre-1.0 minor bump", (_label, commit) => {
            expect(whatBump([commit], "0.3.1")).toEqual({level: 1});
        });

        test("becomes a major bump after 1.0", () => {
            expect(
                whatBump([{type: "fix", notes: [{title: "BREAKING CHANGE", text: "new contract"}]}], "1.4.2")
            ).toEqual({level: 0});
        });

        test("takes precedence over lower-level changes after 1.0", () => {
            expect(whatBump([{type: "fix"}, {type: "feat"}, {type: "refactor", breaking: true}], "2.0.0")).toEqual({
                level: 0,
            });
        });
    });

    test.each(["feat", "revert"])("uses a minor bump for %s", type => {
        expect(whatBump([{type}], "0.3.1")).toEqual({level: 1});
    });

    test.each(["fix", "deps", "perf", "refactor"])("uses a patch bump for %s", type => {
        expect(whatBump([{type}], "0.3.1")).toEqual({level: 2});
    });

    test("does not release for CI and maintenance changes together", () => {
        expect(whatBump([{type: "ci"}, {type: "chore"}, {type: "docs"}], "0.4.0")).toBeNull();
    });

    test("releases a patch for dependency changes alongside CI changes", () => {
        expect(whatBump([{type: "ci"}, {type: "deps"}], "0.4.0")).toEqual({level: 2});
    });

    test("keeps breaking CI changes subject to the breaking-change policy", () => {
        expect(whatBump([{type: "ci", breaking: "!"}], "1.0.0")).toEqual({level: 0});
    });

    test("uses the highest non-breaking bump", () => {
        expect(whatBump([{type: "fix"}, {type: "feat"}], "0.3.1")).toEqual({level: 1});
    });

    test.each(["docs", "test", "chore", "build", "ci", "style"])("does not release for %s alone", type => {
        expect(whatBump([{type}], "0.3.1")).toBeNull();
    });
});

describe("release notes rendering", () => {
    const render = createReleaseConfig().plugins["@release-it/conventional-changelog"].writerOpts.template;

    test("preserves release metadata, breaking notes, sections, links, and multiline bodies", () => {
        const changelog = render({
            name: "@addon-core/inject-css",
            version: "0.4.1",
            date: "2026-10-14",
            noteGroups: [{notes: [{text: "Require the new API"}]}],
            commitGroups: [
                {
                    title: "📦 Dependencies",
                    commits: [
                        {
                            scope: "chrome",
                            subject: "update <types>",
                            href: "https://example.com/commit/123",
                            shorthash: "123",
                            body: "  First line\n  Second line",
                        },
                    ],
                },
            ],
        });
        expect(changelog).toContain("## 🚀 Release `@addon-core/inject-css` v0.4.1 (2026-10-14)");
        expect(changelog).toContain("### 💥 Breaking Changes\n\n* Require the new API");
        expect(changelog).toContain("### 📦 Dependencies");
        expect(changelog).toContain("* **chrome:** update &lt;types&gt; ([123](https://example.com/commit/123))");
        expect(changelog).toContain("  First line\n  Second line");
        expect(changelog).not.toContain("### 🙌 Contributors");
    });

    test("preserves contributor links and email-only contributors", () => {
        const changelog = render({
            version: "0.4.1",
            date: "2026-10-14",
            contributors: [
                {name: "A & B", login: "alice", url: "https://github.com/alice", count: 2},
                {login: "bob", url: "https://github.com/bob", count: 1},
                {name: "Carol", email: "carol@example.invalid", count: 3},
                {email: "dave@example.invalid", count: 1},
            ],
        });
        expect(changelog).toContain("### 🙌 Contributors");
        expect(changelog).toContain("[A &amp; B](https://github.com/alice) (@alice) — 2 commits");
        expect(changelog).toContain("[@bob](https://github.com/bob) — 1 commits");
        expect(changelog).toContain("[Carol](carol@example.invalid) — 3 commits");
        expect(changelog).toContain("dave@example.invalid — 1 commits");
    });
});
