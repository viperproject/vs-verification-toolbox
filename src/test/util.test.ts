import * as assert from 'assert';

import * as util from '..';

suite("util", () => {
    suite("Location", () => {
        test("Basics", async () => {
            const path = (path: string) => path.replace(/\\/g, "/");

            const root = new util.Location("/tmp/folder");
            assert.strictEqual(path(root.basePath), "/tmp/folder");
            assert.strictEqual(
                path(`${root.enclosingFolder}`),
                "Location(/tmp)"
            );
            assert.strictEqual(
                path(`${root.child("sub", "path")}`),
                "Location(/tmp/folder/sub/path)"
            );
            assert.strictEqual(path(root.path("sub", "path")), "/tmp/folder/sub/path");
            assert.ok(
                root.executable("run") === "/tmp/folder/run"
                || root.executable("run") === "\\tmp\\folder\\run.exe",
                `unexpected executable path: ${root.executable("run")}`
            );
            await root.mkdir(); // ensures the folder exists
            assert.ok(await root.exists());
        });
    });

    suite("Platform", () => {
        test("readUbuntuVersion Does not crash", async () => {
            const ubuntuVersion = await util.readUbuntuVersion();
            console.log(`Ubuntu version: ${ubuntuVersion}`);
        });
    });

    // TODO test Progress and (maybe?) Platform
});
