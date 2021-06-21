# KEITH

This monorepo is the home of the KEITH project. It mainly consists of a VSCode extension and a
custom built [Theia IDE](https://theia-ide.org).

## Packages

-   [keith-vscode](./packages/keith-vscode): VSCode extension that adds support for multiple KIELER
    languages in VSCode.

## Requirements

Developing this project required [Node.js _v14.x_](https://nodejs.org) and
[yarn _v1.x_](https://classic.yarnpkg.com/). Further, to develop the VSCode extension language
server jars, named `kieler-language-server.{os-id}.jar`, have to placed in the `keith-vscode/server`
folder. The latest jars can be downloaded
[here](https://rtsys.informatik.uni-kiel.de/~kieler/files/nightly/sccharts/ls/).

## Scripts

> All scripts that are available at the monorepo root. Run a script with `yarn <script>`.

| Script name | Description                                                                                 |
| :---------- | :------------------------------------------------------------------------------------------ |
| clean       | Removes all build results in each package.                                                  |
| lint        | Run eslint in all packages to identify style problems.                                      |
| build       | Builds all packages for production.                                                         |
| watch       | Builds all packages for development in watch mode.                                          |
| package     | Builds and packages all packages for distribution. E.g. creates a `keith-vscode.vsix` file. |

## Developing the VSCode extension

We recommend VSCode to develop the VSCode extension to make use of the provided launch tasks. The
following steps have are required to start developing.

1. Fulfill the requirements above.
1. Install all
   [workspace recommended extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_recommended-extensions).
1. Run `yarn` in the monorepo root to install all dependencies.
1. Run the "Launch VSC Extension" launch configuration. This also runs a task to watch all packages.
1. A VSCode instance with the `keith-vscode` extension should be started. Ensure that you have the
   [klighd-vscode](https://github.com/kieler/klighd-vscode) extension installed.
1. After changes to your files, run the "Reload Window" command in your dev VSCode instance.

The launch configuration "Launch VSC Extension (Socket)" can be used to connect to a Language Server
run in Eclipse. See the
[relevant documentation](https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Running+KEITH#RunningKEITH-SettingupyourEclipse)
for more setup information.
