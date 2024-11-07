import * as extract from 'extract-zip';
import * as fs from 'fs-extra';

import { Canceled, ConfirmResult, DependencyInstaller, InstallResult, Success } from './index.js';
import { Location, ProgressListener } from '../util/index.js';

/** Extracts the zip at the location provided to `install` to a folder named `targetName`. */
export class ZipExtractor implements DependencyInstaller {
	constructor(
		readonly targetName: string,
		readonly deleteZip: boolean = false
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener, confirm:() => Promise<ConfirmResult>): Promise<InstallResult<Location>> {
		const target = location.enclosingFolder.child(this.targetName);
		if (!shouldUpdate && await target.exists()) { return new Success(target); }

		// ask for confirmation:
		const confirmResult = await confirm();
		if (confirmResult !== ConfirmResult.Continue) {
			return new Canceled();
		}

		try {
			await target.mkdir();
			await fs.emptyDir(target.basePath);

			progressListener(0, "Unzipping…");

			let extractedBytes = 0;
			let prevEntrySize = 0;
			await extract.default(location.basePath, {
				dir: target.basePath,
				onEntry: (entry, zip) => {
					extractedBytes += prevEntrySize;
					prevEntrySize = entry.compressedSize;
					progressListener(extractedBytes / zip.fileSize, "Unzipping…");
				}
			});

			progressListener(1, "Unzipped");

			// we don't usually delete the original zip since that would cause it to get re-downloaded on next install
			if (this.deleteZip) {
				location.remove();
			}

			return new Success(target);
		} catch (err) {
			await fs.remove(target.basePath);
			throw err;
		}
	}
}
