import * as fs from 'fs-extra';
import { platform } from 'os';
import * as path from 'path';

/**
 * A simple representation of a folder in the file system, with some convenient methods for navigating through the hierarchy.
 * 
 * This class provides a way to access files for a dependency once it's been downloaded and installed.
 * Also useful for passing around file system locations between `DependencyInstaller`s.
 */
export class Location {
    constructor(
        readonly basePath: string
    ) { }

    /** Returns the parent location of this one. */
    public get enclosingFolder(): Location {
        return new Location(path.dirname(this.basePath));
    }

    /** Returns a path within this location with the given path components. */
    public path(...components: string[]): string {
        return path.join(this.basePath, ...components);
    }

    /** Returns the path to an executable with the given name, appending .exe on windows. */
    public executable(name: string): string {
        return this.path(platform() === "win32" ? `${name}.exe` : name);
    }

    /** Returns a child location within this one with the given path components. */
    public child(...components: string[]): Location {
        return new Location(this.path(...components));
    }

    /** Returns whether or not the folder this location represents currently exists on the file system. */
    public exists(): Promise<boolean> {
        return fs.pathExists(this.basePath);
    }

    /** Makes sure the folder this location represents exists, creating an empty one if it doesn't yet. */
    public mkdir(): Promise<void> {
        return fs.ensureDir(this.basePath);
    }

    public async unlinkIfExists(): Promise<void> {
        if (await this.exists()) {
            await fs.unlink(this.basePath);
        }
    }

    public toString(): string {
        return `Location(${this.basePath})`;
    }
}
