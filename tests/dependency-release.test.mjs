import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {copyFileSync, mkdtempSync, readFileSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {text} from "node:stream/consumers";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import conventionalCommitConfig from "@commitlint/config-conventional";
import {ConventionalChangelog} from "conventional-changelog";
import {CommitParser} from "conventional-commits-parser";
import createReleaseConfig from "../.release-it.cjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const renovate = JSON.parse(readFileSync(join(root, "renovate.json"), "utf8"));
const commitlint = JSON.parse(readFileSync(join(root, ".commitlintrc.json"), "utf8"));
const release = createReleaseConfig();
const options = release.plugins["@release-it/conventional-changelog"];
const parse = message => new CommitParser(options.parserOpts).parse(message);
const scope = renovate.semanticCommitScope ? `(${renovate.semanticCommitScope})` : "";
const updateMessage = `${renovate.semanticCommitType}${scope}: update dependencies`;

const lint = message =>
    spawnSync(process.execPath, [join(root, "node_modules/@commitlint/cli/cli.js"), "--strict"], {
        cwd: root,
        input: message,
        encoding: "utf8",
        timeout: 10000,
    });

test("Renovate's commit passes commitlint and triggers a patch release", () => {
    assert.equal(updateMessage, "deps: update dependencies");
    const result = lint(updateMessage);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(options.whatBump([parse(updateMessage)], "0.4.0"), {level: 2});
});

test("commitlint preserves conventional types and rejects unknown types", () => {
    for (const type of conventionalCommitConfig.rules["type-enum"][2]) {
        assert.ok(commitlint.rules["type-enum"][2].includes(type));
    }
    const result = lint("depz: update dependencies");
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /type-enum/);
});

for (const [message, version, level] of [
    ["deps(chrome): update chrome types", "0.4.0", 2],
    ["deps(chrome): update chrome types", "1.2.3", 2],
    ["deps!: require Chrome 140", "0.4.0", 1],
    ["deps!: require Chrome 140", "1.2.3", 0],
    ["deps: update browser\n\nBREAKING CHANGE: require Chrome 140", "1.2.3", 0],
]) {
    test(`applies the release policy to ${message} at ${version}`, () => {
        assert.deepEqual(options.whatBump([parse(message)], version), {level});
    });
}

test("renders dependency updates in Dependencies in changelog and GitHub release notes", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "inject-css-dependency-release-"));
    // Isolate fixture commits from hooks, signing settings, and parent Git environment.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
    const git = (...args) => {
        const result = spawnSync(
            "git",
            [
                "-c",
                `core.hooksPath=${join(cwd, "no-hooks")}`,
                "-c",
                "commit.gpgSign=false",
                "-c",
                "tag.gpgSign=false",
                "-c",
                "user.name=Release Test",
                "-c",
                "user.email=release-test@example.invalid",
                ...args,
            ],
            {cwd, env, encoding: "utf8", timeout: 10000}
        );
        assert.equal(result.status, 0, result.error?.message || result.stderr);
    };

    try {
        git("init", "--quiet");
        git("commit", "--allow-empty", "-m", "chore: initial release");
        git("tag", "v0.4.0");
        git("commit", "--allow-empty", "-m", updateMessage);
        git("commit", "--allow-empty", "-m", "deps(chrome): update chrome types");
        git("commit", "--allow-empty", "-m", "fix(inject): fix injection results");

        const changelog = await text(
            new ConventionalChangelog(cwd)
                .loadPreset(options.preset)
                .context({...options.context, version: "0.4.1", contributors: []})
                .commits({from: "v0.4.0"}, options.parserOpts)
                .writer(options.writerOpts)
                .writeStream()
        );
        const sections = changelog.split(/^### /m);
        const dependencies = sections.find(section => section.startsWith("📦 Dependencies\n"));
        const fixes = sections.find(section => section.startsWith("🐛 Bug Fixed\n"));
        assert.match(dependencies, /update dependencies/);
        assert.match(dependencies, /\*\*chrome:\*\* update chrome types/);
        assert.doesNotMatch(dependencies, /fix injection results/);
        assert.match(fixes, /fix injection results/);
        assert.doesNotMatch(fixes, /update dependencies/);
        assert.doesNotMatch(changelog, /🧩 Other/);
        assert.equal(release.github.releaseNotes({changelog}), changelog);

        // Exercise the installed release-it CLI as well as the writer, without publishing.
        copyFileSync(join(root, "package.json"), join(cwd, "package.json"));
        copyFileSync(join(root, ".release-it.cjs"), join(cwd, ".release-it.cjs"));
        symlinkSync(join(root, "node_modules"), join(cwd, "node_modules"), "junction");
        const dryRun = () => {
            const result = spawnSync(
                process.execPath,
                [
                    join(root, "node_modules/release-it/bin/release-it.js"),
                    "--ci",
                    "--dry-run",
                    "--no-git.push",
                    "--no-git.commit",
                    "--no-git.tag",
                    "--git.requireCleanWorkingDir=false",
                    "--no-github",
                    "--no-npm.publish",
                    "--npm.skipChecks",
                ],
                {cwd, env: {...env, HUSKY: "0"}, encoding: "utf8", timeout: 20000}
            );
            assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
            assert.equal(
                readFileSync(join(cwd, "package.json"), "utf8"),
                readFileSync(join(root, "package.json"), "utf8")
            );
            return result.stdout;
        };
        const patchRelease = dryRun();
        assert.match(patchRelease, /0\.4\.0.*0\.4\.1/);
        assert.match(patchRelease, /📦 Dependencies/);
        assert.match(patchRelease, /update chrome types/);

        git("checkout", "--quiet", "-b", "ci-only", "v0.4.0");
        git("commit", "--allow-empty", "-m", "ci: update workflow runtime");
        const ciOnly = dryRun();
        assert.match(ciOnly, /No new version to release/);
        assert.doesNotMatch(ciOnly, /0\.4\.1/);
    } finally {
        rmSync(cwd, {recursive: true, force: true});
    }
});
