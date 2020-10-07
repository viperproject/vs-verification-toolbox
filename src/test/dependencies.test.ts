import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';
import * as md5File from 'md5-file';

import { Dependency, FileDownloader, InstallerSequence, LocalReference, ZipExtractor } from '..';
import { withProgressInWindow } from '../util';
import { GitHubReleaseAsset } from '../dependencies';

suite("dependencies", () => {

    const PROJECT_ROOT = path.join(__dirname, "../../");
    const TMP_PATH: string = path.join(PROJECT_ROOT, "src", "test", "tmp");
    const HTTP_DOWNLOAD_URL: string = "http://viper.ethz.ch/examples/";
    const HTTP_DOWNLOAD_TIMEOUT_MS: number = 10 * 1000; // 10s
    const HTTPS_DOWNLOAD_URL: string = "https://ethz.ch";
    const HTTPS_DOWNLOAD_TIMEOUT_MS: number = 10 * 1000; // 10s
    const PRUSTI_UBUNTU_ASSET_DOWNLOAD_TIMEOUT_MS: number = 3 * 60 * 1000; // 3min

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

    test("Get tagged asset url", async function() {
        this.timeout(PRUSTI_UBUNTU_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "prusti-release-ubuntu.zip";
        const url = await GitHubReleaseAsset.getTaggedAssetUrl(
            "viperproject", "prusti-dev", assetName, "v-2020-10-06-1807");
        console.info(`URL to prusti-dev Ubuntu asset of v-2020-10-06-1807 release: '${url}'`);

        // now download the zip:
        const headers = {
            "Accept": "application/octet-stream"
        };
        const myDependency = new Dependency<"remote">(
            TMP_PATH,
            ["remote",
                new InstallerSequence([
                    new FileDownloader(url, headers, assetName)
                ])
            ]
        );
        const { result: downloadDestination } = await withProgressInWindow(
            "Testing download of a GitHub asset",
            listener => myDependency.install("remote", true, listener));
        console.log(`Prusti asset downloaded to '${downloadDestination.basePath}'`);
        // check md5 of this file
        const expected: string = "f7d4dd24eb40c0375d7a37d839ca515b";
        const actual: string = await md5File(downloadDestination.basePath);
        assert.strictEqual(actual, expected, `md5 hash of downloaded Prusti release asset does not match`);
    });

    test("Get latest pre-release asset url", async function() {
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            "viperproject", "prusti-dev", "prusti-release-ubuntu.zip", /* includePrerelease */ true);
        console.info(`URL to latest non-pre- or pre-release prusti-dev Ubuntu asset is: '${url}'`);
    });

    test("Get latest asset url", async function() {
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            "viperproject", "prusti-dev", "prusti-release-ubuntu.zip");
        console.info(`URL to latest non-pre-release prusti-dev Ubuntu asset is: '${url}'`);
    });

    suiteTeardown(function() {
        // delete tmp directory containing downloaded files:
        if (fs.existsSync(TMP_PATH)) {
            fs.rmdirSync(TMP_PATH, { recursive: true });
        }
    });
});
