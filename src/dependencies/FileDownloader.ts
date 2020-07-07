import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';

import { DependencyInstaller, Location, ProgressListener } from '..';

export class FileDownloader implements DependencyInstaller {
	constructor(
		readonly remoteUrl: string
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener): Promise<Location> {
		const filename = path.basename(this.remoteUrl);
		const target = location.child(filename);

		if (!shouldUpdate && await target.exists()) { return target; }

		const temp = location.child(`.${filename}.download`);
		await temp.unlinkIfExists();
		const tempFile = fs.createWriteStream(temp.basePath);

		try {
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
						tempFile.write(chunk);
						progressListener(currentSize / totalSize, "Downloading…");
					});

					response.on("end", () => {
						tempFile.close();
						resolve();
					});

					response.on("error", async (err) => {
						reject(err);
					});
				});
			});

			await target.unlinkIfExists();
			await fs.move(temp.basePath, target.basePath);

			return target;
		} catch (e) {
			await temp.unlinkIfExists();
			throw e;
		}
	}
}
