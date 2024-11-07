/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { runTests } from '@vscode/test-electron';

const FILE_NAME = fileURLToPath(import.meta.url); // get the resolved path to the file
const DIRNAME = path.dirname(FILE_NAME); // get the name of the directory
const PROJECT_ROOT = path.join(DIRNAME, "..", "..");
const DATA_ROOT = path.join(PROJECT_ROOT, "src", "test", "data");

const main: () => Promise<void> = async () => {
    try {
        const argv = await yargs()
            .option('token', {
                description: 'GitHub access token that should be used for GitHub API calls. '
                    + 'Use the "GITHUB_TOKEN" environment variable for CI as node logs the command incl. arguments',
                type: 'string',
            })
            .help() // show help if `--help` is used
            .argv;

        console.info("Reading VS Code version...");
        const vscodeVersion = fs.readFileSync(path.join(DATA_ROOT, "vscode-version")).toString().trim();
        console.info(`Tests will use VS Code version '${vscodeVersion}'`);

        // pass token as environment variable to the extension test:
        let extensionTestsEnv;
        if (argv.token != null) {
            extensionTestsEnv = {
                "GITHUB_TOKEN": argv.token,
            };
        } else if (process.env.GITHUB_TOKEN != null) {
            extensionTestsEnv = {
                "GITHUB_TOKEN": process.env.GITHUB_TOKEN,
            };
        }

        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './index');

        const testOption = {
            version: vscodeVersion,
            extensionDevelopmentPath,
            extensionTestsPath,
            extensionTestsEnv,
            // Disable any other extension
            launchArgs: ["--disable-extensions"],
        };

        // Download VS Code, unzip it and run the integration test
        await runTests(testOption);
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
};

main().catch((err) => {
    console.error(`main function has ended with an error: ${err}`);
    process.exit(1);
});
