# VS Verification Toolbox

This module provides several useful tools for writing VS Code extensions that verify code.

## Features

### General Utilities

The `util` package offers several convenient utilities and wrappers.

#### File System Locations

A `Location ` represents a directory on the file system, providing a simple API for navigating through the hierarchy. Example usage:

```typescript
const root = new Location("/tmp/folder");
root.basePath; // "/tmp/folder"
root.enclosingFolder; // Location(/tmp)
root.child("sub", "path"); // Location(/tmp/folder/sub/path)
root.path("sub", "path"); // "/tmp/folder/sub/path"
root.executable("run"); // unix-based: "/tmp/folder/run"; windows: "/tmp/folder/run.exe"
await root.mkdir(); // ensures the folder exists
await root.exists(); // true
```

#### Platform Checking

`Platform` is a simple enum representing the three major platforms: `Linux`, `Windows`, `Mac`.

It also provides a constant `currentPlatform` equal to the current platform, or `null` if it's not one of those three.

#### Progress Reporting

The `ProgressListener` type describes a callback for reporting progress from long-running asynchronous tasks. It takes the fraction of the task that is complete, as well as a user-facing description of the current step.

Additionally, there is a very convenient function `withProgressInWindow` that runs an asynchronous task, forwarding the progress it reports (to the given `ProgressListener`) to the VS Code window as a notification with a nice progress bar.

### Dependency Installation

The `dependencies` package provides a way to define your dependencies declaratively and install them asynchronously.

An example dependency might be defined as follows:

```typescript
const myDependency = new Dependency<"remote" | "local">(
    "/path/to/install/folder",
    ["remote",
        new InstallerSequence([
            new FileDownloader("https://remote.com/file.zip"),
            new ZipExtractor("unzipped"),
        ])
    ],
    ["local", new LocalReference("/path/to/external/local/installation")]
);
```

This defines a dependency with two sources (`remote` and `local`) which is installed within /path/to/install/folder.

If you then run `await myDependency.ensureInstalled("remote")`, it will give you a `Location` referencing the location of the local installation from the `remote` source. If it's already installed, it won't do any extra work; otherwise it will download the file at https://remote.com/file.zip and unzip it into a folder named `unzipped`. Either way, you get back the location of the `unzipped` folder. You can force a reinstall even if it already exists by calling `update` instead of `ensureInstalled`.

If you instead run `await myDependency.ensureInstalled("local")` (or `update`, `install`, etc.), it will simply give you back a reference to the folder at /path/to/external/local/installation, after ensuring that folder actually exists.

