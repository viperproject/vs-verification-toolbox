import { ConfirmResult, DependencyInstaller, InstallResult, Location, ProgressListener, Success } from '..';

export class InstallerSequence {
	constructor(readonly installers: DependencyInstaller[]) {
		// flatten nested sequences
		this.installers = installers.reduce((list: DependencyInstaller[], installer) => {
			if (installer instanceof InstallerSequence) {
				list.push(...installer.installers);
			} else {
				list.push(installer);
			}
			return list;
		}, []);
	}

	public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener, confirm:() => Promise<ConfirmResult>): Promise<InstallResult<Location>> {
		let index = 0;
		let firstConfirmPromise: Promise<ConfirmResult> | undefined = undefined;
		let result: InstallResult<Location> = new Success(location);
		const total = this.installers.length;
		for (const installer of this.installers) {
			function intermediateListener(fraction: number, message: string) {
				progressListener(
					(index + fraction) / total,
					`${message} (step ${index + 1} of ${total})`
				);
			}
			function intermediateConfirm(): Promise<ConfirmResult> {
				// only ask once
				if (firstConfirmPromise == null) {
					firstConfirmPromise = confirm();
					return firstConfirmPromise;
				} else {
					// return same promise:
					return firstConfirmPromise;
				}
			}

			if (result instanceof Success) {
				// continue with next installer
				result = await installer.install(result.value, shouldUpdate, intermediateListener, intermediateConfirm);
			}
			index++;
		}
		return result;
	}
}
