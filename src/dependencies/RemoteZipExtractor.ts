import * as path from 'path';

import { ConfirmResult, DependencyInstaller, FileDownloader, Location, InstallerSequence, InstallResult, ProgressListener, Success, ZipExtractor } from '..';

export class RemoteZipExtractor implements DependencyInstaller {
    private readonly sequence: InstallerSequence;

    constructor(
        readonly remoteUrl: string,
        readonly folderName: string = path.basename(remoteUrl, path.extname(remoteUrl))
    ) {
        this.sequence = new InstallerSequence([
            new FileDownloader(this.remoteUrl),
            new ZipExtractor(this.folderName, true),
        ]);
    }

    public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener, confirm:() => Promise<ConfirmResult>): Promise<InstallResult<Location>> {
        const target = location.child(this.folderName);

        if (!shouldUpdate && await target.exists()) { return new Success(target); }

        // we do not ask here for confirmation but defer that to the InstallerSequence

        return this.sequence.install(location, shouldUpdate, progressListener, confirm);
    }
}
