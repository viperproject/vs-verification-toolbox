import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs-extra';
import * as path from 'path';
import { URL } from 'url';

import { DependencyInstaller, Location, ProgressListener } from '..';

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
			await new Promise((resolve, reject) => {
				this.get(this.remoteUrl, (response: http.IncomingMessage) => {
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

	/** 
	 * wrapper for http.get and https.get
	 * this is a text book example for a bad library especially since http.get and https.get share 
	 * the same callback argument and return type
	 */
	private get(url: string, callback?: (res: http.IncomingMessage) => void): http.ClientRequest {
		const prot: string = new URL(url).protocol;
		switch (prot) {
			case "http:":
				return http.get(url, callback);
			case "https:":
				return https.get(url, callback);
			default:
				throw `unknown protocol '${prot}'`;
		}
	}
}
