import * as assert from 'assert';

import { Dependency, FileDownloader, InstallerSequence, LocalReference, ZipExtractor } from '..';

suite("dependencies", () => {
    test("Dependency Definition", () => {
        const myDependency = new Dependency<"remote" | "local">(
            "/path/to/install/folder",
            ["remote",
                new InstallerSequence([
                    new FileDownloader("https://remote.com/file.zip"),
                    new ZipExtractor("unzipped"),
                ])
            ],
            ["local", new LocalReference("/path/to/external/local/installation")]
        );
        // just demonstrating that it doesn't crash; this is the example from the readme.
    });

    // TODO test the actual installer components.
});
