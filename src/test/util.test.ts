import * as assert from 'assert';

import { Location } from '..';

suite("util", () => {
    suite("Location", () => {
        test("Basics", async () => {
            const path = (path: string) => path.replace(/\\/g, "/");

            const root = new Location("/tmp/folder");
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
            assert(
                root.executable("run") === "/tmp/folder/run"
                || root.executable("run") === "\\tmp\\folder\\run.exe",
                `unexpected executable path: ${root.executable("run")}`
            );
            await root.mkdir(); // ensures the folder exists
            assert(await root.exists());
        });
    });

    // TODO test Progress and (maybe?) Platform
});
