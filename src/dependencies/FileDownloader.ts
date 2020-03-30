import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';

import { DependencyInstaller } from './Dependency';
import { Location, ProgressListener } from '../util';

export class FileDownloader implements DependencyInstaller {
	constructor(
		readonly remoteUrl: string
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener): Promise<Location> {
		const target = location.child(path.basename(this.remoteUrl));
		const targetExists = await target.exists();
		if (!shouldUpdate && targetExists) { return target; }

		if (targetExists) {
			await fs.unlink(target.basePath);
		}

		const localPath = target.basePath;
		const file = fs.createWriteStream(localPath);

		await new Promise((resolve, reject) => {
			http.get(this.remoteUrl, (response) => {
				if (response.statusCode !== 200) {
					reject(`request to ${this.remoteUrl} failed with status code ${response.statusCode}`);
				}

				const totalSize = parseInt(response.headers["content-length"]!, 10);
				let currentSize = 0;

				progressListener(0, "Downloading…");
				response.on("data", (chunk) => {
					currentSize += chunk.length;
					progressListener(currentSize / totalSize, "Downloading…");
				});

				response.pipe(file);

				response.on("end", () => {
					file.close();
					resolve();
				});

				response.on("error", (err) => {
					fs.unlink(localPath, (_: unknown) => {
						console.log("Could not remove downloaded file.");
					});
					reject(err);
				});
			});
		});

		return target;
	}
}
