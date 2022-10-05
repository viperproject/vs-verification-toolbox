import * as os from 'os';
import * as fs from 'fs-extra';

export enum Platform {
    Linux,
    Windows,
    Mac,
}

export const currentPlatform: Platform | null = (() => {
    const platform = os.platform();
    switch (platform) {
        case "linux":
            return Platform.Linux;
        case "win32":
            return Platform.Windows;
        case "darwin":
            return Platform.Mac;
        default:
            console.log(`Unsupported platform: ${platform}`);
            return null;
    }
})();

export enum UbuntuVersion {
    v14_04 = "14.04", // End of Life: April 2024
    v16_04 = "16.04", // End of Life: April 2026
    v18_04 = "18.04", // End of Life: April 2028
    v20_04 = "20.04", // End of Life: April 2030
    v20_10 = "20.10", // Dead
    v21_04 = "21.04", // Dead
    v21_10 = "21.10", // Dead
    v22_04 = "22.04", // End of Life: April 2032
    v22_10 = "22.10", // End of Standard Support: July 20, 2023
    v23_04 = "23.04", // End of Life: ???
    v23_10 = "23.10", // End of Life: ???
    Unknown = "unknown",
}

export async function readLinuxReleaseDetails(): Promise<Record<string, string> | null> {
    let data: string;
    try {
        data = await fs.readFile("/etc/os-release", "utf8");
    } catch (err) {
        console.log(`Failed to read /etc/os-release: ${err}`);
        return null;
    }
    const lines: string[] = data.split("\n");
    const releaseDetails: Record<string, string> = {};
    lines.forEach((line) => {
        // Split the line into an array of words delimited by "=" and remove quotes
        const words = line.split("=");
        if (words.length > 1) {
            releaseDetails[words[0].trim().toLowerCase()] = words[1].trim().replace(/^"(.*)"$/, '$1');
        }
    });
    return releaseDetails
}

export async function readUbuntuVersion(): Promise<UbuntuVersion | null> {
    const releaseDetails = await readLinuxReleaseDetails();
    if (releaseDetails == null) {
        return null;
    }
    const releaseName = releaseDetails.name;
    if (releaseName != "Ubuntu") {
        console.log(`Unknown Linux release name: ${releaseName}`);
        return null;
    }
    const releaseVersion = releaseDetails.version_id;
    if (releaseVersion == undefined) {
        console.log("The Ubuntu release version is undefined");
        return UbuntuVersion.Unknown;
    }
    if ((Object.values(UbuntuVersion) as unknown[]).indexOf(releaseVersion) >= 0) {
        return releaseVersion as UbuntuVersion;
    } else {
        console.log(`Unknown Ubuntu release version: ${releaseVersion}`);
        return UbuntuVersion.Unknown;;
    }
}
