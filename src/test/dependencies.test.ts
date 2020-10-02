import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';

import { Dependency, FileDownloader, InstallerSequence, LocalReference, ZipExtractor } from '..';
import { withProgressInWindow } from '../util';

suite("dependencies", () => {

    const PROJECT_ROOT = path.join(__dirname, "../../");
    const TMP_PATH: string = path.join(PROJECT_ROOT, "src", "test", "tmp");
    const HTTP_DOWNLOAD_URL: string = "http://viper.ethz.ch/examples/";
    const HTTP_DOWNLOAD_TIMEOUT_MS: number = 10 * 1000;
    const HTTPS_DOWNLOAD_URL: string = "https://ethz.ch";
    const HTTPS_DOWNLOAD_TIMEOUT_MS: number = 10 * 1000;

    suiteSetup(function() {
        // create a tmp directory for downloading files to it
        if (!fs.existsSync(TMP_PATH)) {
            fs.mkdirSync(TMP_PATH);
        }
    });

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

    test("HTTP Download", function() {
        this.timeout(HTTP_DOWNLOAD_TIMEOUT_MS);
        const myDependency = new Dependency<"remote">(
            TMP_PATH,
            ["remote",
                new InstallerSequence([
                    new FileDownloader(HTTP_DOWNLOAD_URL)
                ])
            ]
        );
        return withProgressInWindow(
            "Testing download of an HTTP file",
            listener => myDependency.install("remote", true, listener));
    });

    test("HTTPS Download", function() {
        this.timeout(HTTPS_DOWNLOAD_TIMEOUT_MS);
        const myDependency = new Dependency<"remote">(
            TMP_PATH,
            ["remote",
                new InstallerSequence([
                    new FileDownloader(HTTPS_DOWNLOAD_URL)
                ])
            ]
        );
        return withProgressInWindow(
            "Testing download of an HTTP file",
            listener => myDependency.install("remote", true, listener));
    });

    suiteTeardown(function() {
        // delete tmp directory containing downloaded files:
        if (fs.existsSync(TMP_PATH)) {
            fs.rmdirSync(TMP_PATH, { recursive: true });
        }
    });
});
