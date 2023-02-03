import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';
import { runTests } from '@vscode/test-electron';

const PROJECT_ROOT = path.join(__dirname, "..", "..");
const DATA_ROOT = path.join(PROJECT_ROOT, "src", "test", "data");

async function main(): Promise<void> {
    try {
        const argv = await yargs
            .option('token', {
                description: 'GitHub access token that should be used for GitHub API calls. '
                    + 'Use the "GITHUB_TOKEN" environment variable for CI as node logs the command incl. arguments',
                type: 'string',
            })
            .help() // show help if `--help` is used
            .argv;

        console.info("Reading VS Code version...");
        const vscode_version = fs.readFileSync(path.join(DATA_ROOT, "vscode-version")).toString().trim();
        console.info(`Tests will use VS Code version '${vscode_version}'`);

        let extensionTestsEnv;
        if (argv.token || process.env["GITHUB_TOKEN"]) {
            // pass token as environment variable to the extension test:
            extensionTestsEnv = {
                "GITHUB_TOKEN": argv.token || process.env["GITHUB_TOKEN"],
            };
        }

        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './index');

        const testOption = {
            version: vscode_version,
            extensionDevelopmentPath: extensionDevelopmentPath,
            extensionTestsPath: extensionTestsPath,
            extensionTestsEnv: extensionTestsEnv,
            // Disable any other extension
            launchArgs: ["--disable-extensions"],
        };

        // Download VS Code, unzip it and run the integration test
        await runTests(testOption);
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(`main function has ended with an error: ${err}`);
    process.exit(1);
});
