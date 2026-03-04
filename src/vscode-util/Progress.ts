import * as vscode from 'vscode';

import { ProgressListener } from '../util/index.js';

/**
 * Runs an asynchronous task, forwarding the progress it reports to the VS Code window as a notification with the given title.
 * It returns the task's result, as well as whether any progress was reported at all, for your convenience.
 */
export const withProgressInWindow = async<R> (
    title: string, task: (progressListener: ProgressListener) => Promise<R>
): Promise<{ result: R; didReportProgress: boolean }> => {
    let lastProgress = 0;
    let didReportProgress = false;
    const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title
    }, (progress) => task((fraction, step) => {
        didReportProgress = true;
        if (fraction - lastProgress < 0.01) { return; }
        progress.report({ message: step, increment: (fraction - lastProgress) * 100 });
        lastProgress = fraction;
    }));
    return { result, didReportProgress };
};
