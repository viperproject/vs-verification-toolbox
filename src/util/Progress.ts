import * as vscode from 'vscode';

/**
 * Reports overall progress made within the current task.
 * `fraction` is the amount of progress (out of 1).
 * `step` is a user-facing short description of what is currently happening.
 */
export type ProgressListener = (fraction: number, step: string) => void;

export async function withProgressInWindow<R>(
    title: string, task: (progressListener: ProgressListener) => Promise<R>
): Promise<{ result: R, didReportProgress: boolean }> {
    let lastProgress = 0;
    let didReportProgress = false;
    const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title
    }, (progress) => {
        return task((fraction, step) => {
            didReportProgress = true;
            if (fraction - lastProgress < 0.01) { return; }
            progress.report({ message: step, increment: (fraction - lastProgress) * 100 });
            lastProgress = fraction;
        });
    });
    return { result, didReportProgress };
}
