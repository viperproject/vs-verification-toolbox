import * as fs from 'fs-extra';
import * as path from 'path';
import got, { Progress } from 'got';
import * as stream from 'stream';
import { promisify } from 'util';

import { DependencyInstaller, Location, ProgressListener } from '..';


const pipeline = promisify(stream.pipeline);

export class FileDownloader implements DependencyInstaller {
	constructor(
		readonly remoteUrl: string
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener): Promise<Location> {
		const filename = path.basename(this.remoteUrl);
		const target = location.child(filename);

		if (!shouldUpdate && await target.exists()) { return target; }

		await location.mkdir();
		const temp = location.child(`.${filename}.download`);
		await temp.unlinkIfExists();
		const tempFile = fs.createWriteStream(temp.basePath);

		try {
			progressListener(0, "Downloading…");
			await pipeline(
				got
					.stream(this.remoteUrl)
					.on('downloadProgress', (prog: Progress) => progressListener(prog.percent, "Downloading…")),
				tempFile
			);
	
			await target.unlinkIfExists();
			await fs.move(temp.basePath, target.basePath);

			return target;
		} catch (e) {
			await temp.unlinkIfExists();
			throw e;
		}
	}
}
