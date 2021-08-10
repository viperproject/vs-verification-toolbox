import * as fs from 'fs-extra';

import { ConfirmResult, DependencyInstaller, Location, InstallResult, ProgressListener, Success } from '..';

export class LocalReference implements DependencyInstaller {
	constructor(
		readonly referencePath: string
	) { }

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener, confirm:() => Promise<ConfirmResult>): Promise<InstallResult<Location>> {
		if (!await fs.pathExists(this.referencePath)) {
			throw new Error(`Can't create a local reference to the nonexistent location ${this.referencePath}`);
		}
		return new Success(new Location(this.referencePath));
	}
}
