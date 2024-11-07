/* eslint-disable import/no-extraneous-dependencies */
import { glob } from 'glob';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Mocha from 'mocha';

// kept as-is (except for the mocha config) from `yo code` extension template
export const run: () => Promise<void> = async () => {
    // Create the mocha test
    const mocha = new Mocha.default({
        ui: 'tdd',
        timeout: 2000, // ms
        color: true,
    });

    const filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const dirname = path.dirname(filename); // get the name of the directory
    const testsRoot = path.resolve(dirname, '..');

    const files = await glob('**/**.test.js', { cwd: testsRoot });

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    await new Promise<void>((c, e) => {
        try {
            // Run the mocha test
            mocha.run(failures => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                } else {
                    c();
                }
            });
        } catch (err) {
            e(err);
        }
    });
};
