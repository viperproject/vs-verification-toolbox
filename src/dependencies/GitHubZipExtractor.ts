import * as path from 'path';

import { ConfirmResult, DependencyInstaller, FileDownloader, InstallerSequence, InstallResult, Success, ZipExtractor } from './';
import { Location, ProgressListener } from '../util';

/**
 * Extension of RemoteZipExtractor with the following features:
 * - no remote URL needed at construction time: a (potentially expensive) computation of the remote URL is only 
 *   performed when a download will actually take place.
 * - the correct header for downloading a GitHub release asset is set
 * - if a GitHub token is provided it is used to perform the download as an authenticated user
 */
export class GitHubZipExtractor implements DependencyInstaller {
    private sequence: InstallerSequence | undefined;

    constructor(
        private readonly remoteUrlFn: () => Promise<string>,
        private readonly folderName: string, // non optional as we need to determine whether a download is necessary
        private readonly token?: string
    ) { }

    public async install(location: Location, shouldUpdate: boolean, progressListener: ProgressListener, confirm:() => Promise<ConfirmResult>): Promise<InstallResult<Location>> {
        const target = location.child(this.folderName);

        if (!shouldUpdate && await target.exists()) { return new Success(target); }

        // we do not ask here for confirmation but defer that to the InstallerSequence

        if (this.sequence == null) {
            const remoteUrl = await this.remoteUrlFn();

            const downloadHeaders: Record<string, string | string[] | undefined> = {
                "Accept": "application/octet-stream"
            };
            if (this.token) {
                downloadHeaders["Authorization"] = `token ${this.token}`;
            }

            // lazily initialize sequence:
            this.sequence = new InstallerSequence([
                new FileDownloader(remoteUrl, downloadHeaders),
                new ZipExtractor(this.folderName, true),
            ]);
        }

        return this.sequence.install(location, shouldUpdate, progressListener, confirm);
    }
}
