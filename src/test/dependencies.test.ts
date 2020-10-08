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
    const SMALL_ASSET_DOWNLOAD_TIMEOUT_MS: number = 5 * 1000; // 5s for 10 bytes
    const MEDIUM_ASSET_DOWNLOAD_TIMEOUT_MS: number = 10 * 1000; // 10s for 1MB
    const LARGE_ASSET_DOWNLOAD_TIMEOUT_MS: number = 30 * 1000; // 30s for 10MB
    const ASSET_OWNER: string = "viperproject";
    const ASSET_REPO: string = "vs-verification-toolbox-release-testing";

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

    test("Tagged binary asset", async function() {
        this.timeout(SMALL_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "small.bin";
        const tag = "v1.1";
        const md5Hash = "a0948bb73029668fec22741c38b611ef";
        const url = await GitHubReleaseAsset.getTaggedAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName, tag);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    test("Tagged zip asset", async function() {
        this.timeout(LARGE_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "large.zip";
        const tag = "v1";
        const md5Hash = "7dcd4caa25bceaabdb2ca525377fab0b";
        const url = await GitHubReleaseAsset.getTaggedAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName, tag);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    test("Get latest pre-release binary asset url", async function() {
        this.timeout(MEDIUM_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "medium.bin";
        // latest prerelease is v1.2
        const md5Hash = "d1b9d86a9ea97fa0d2f9dd32ac99ea57";
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName, /* includePrerelease */ true);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    test("Get latest pre-release zip asset url", async function() {
        this.timeout(SMALL_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "small.zip";
        // latest prerelease is v1.2
        const md5Hash = "aaf83dc77a9fe4e0379476e3d16940f6";
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName, /* includePrerelease */ true);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    test("Get latest (non-pre-release) binary asset url", async function() {
        this.timeout(LARGE_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "large.bin";
        // latest non-pre-release is v1
        const md5Hash = "1c9e58ecee1520efcabee1525f858637";
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    test("Get latest (non-pre-release) zip asset url", async function() {
        this.timeout(MEDIUM_ASSET_DOWNLOAD_TIMEOUT_MS);
        const assetName = "medium.zip";
        // latest non-pre-release is v1
        const md5Hash = "c3163d654efcc01ff707c3a938764040";
        const url = await GitHubReleaseAsset.getLatestAssetUrl(
            ASSET_OWNER, ASSET_REPO, assetName);
        await downloadAndCheckGitHubAsset(url, assetName, md5Hash);
    });

    async function downloadAndCheckGitHubAsset(url: string, assetName: string, md5Hash: string): Promise<void> {
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
            `Downloading GitHub asset ${assetName}`,
            listener => myDependency.install("remote", true, listener));
        // check md5 of this file
        const actual: string = await md5File(downloadDestination.basePath);
        assert.strictEqual(actual, md5Hash, `md5 hash does not match for asset named '${assetName} (downloaded from ${url})`);
    }

    suiteTeardown(function() {
        // delete tmp directory containing downloaded files:
        if (fs.existsSync(TMP_PATH)) {
            fs.rmdirSync(TMP_PATH, { recursive: true });
        }
    });
});
