import * as path from 'path';
import * as yargs from 'yargs';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const argv = await yargs
            .option('token', {
                description: 'GitHub access token that should be used for GitHub API calls. '
                    + 'Use the "GITHUB_TOKEN" environment variable for CI as node logs the command incl. arguments',
                type: 'string',
            })
            .help() // show help if `--help` is used
            .argv;

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

main();
