import * as extractZip from 'extract-zip';
import * as fs from 'fs-extra';

import { DependencyInstaller, Location, ProgressListener } from '..';

/** Extracts the zip at the location provided to `install` to a folder named `targetName`. */
export class ZipExtractor implements DependencyInstaller {
	constructor(
		readonly targetName: string
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener): Promise<Location> {
		const target = location.enclosingFolder.child(this.targetName);
		if (!shouldUpdate && await target.exists()) { return target; }

		try {
			await target.mkdir();
			await fs.emptyDir(target.basePath);

			progressListener(0, "Unzipping…");

			let extractedBytes = 0;
			let prevEntrySize = 0;
			// TODO remove debug logging
			console.log("starting zip extraction");
			await extractZip(location.basePath, {
				dir: target.basePath,
				onEntry: (entry, zip) => {
					console.log(`starting entry of size ${entry.compressedSize}`);
					extractedBytes += prevEntrySize;
					prevEntrySize = entry.compressedSize;
					progressListener(extractedBytes / zip.fileSize, "Unzipping…");
				}
			});
			console.log("finished zip extraction");

			progressListener(1, "Unzipped");

			// don't delete the original zip since that would cause it to get re-downloaded on next install
			return target;
		} catch (err) {
			await fs.remove(target.basePath);
			throw err;
		}
	}
}
