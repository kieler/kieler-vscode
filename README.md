# KEITH

This monorepo is the home of the KIELER VS Code project. It mainly consists of a Visual Studio Code extension.

## Packages

-   [keith-vscode](./packages/keith-vscode): VS Code extension that adds support for multiple KIELER
    languages in VS Code.

## Requirements

Development of this project requires [Node.js _v14.x_](https://nodejs.org) and
[yarn _v1.x_](https://classic.yarnpkg.com/). Further, language server jars, named
`kieler-language-server.{os-id}.jar`, have to placed in the `keith-vscode/server` folder to develop
the VS Code extension. The latest jars can be downloaded
[here](https://rtsys.informatik.uni-kiel.de/~kieler/files/nightly/sccharts/ls/).

The `keith-vscode` extension has a dependency on the
[klighd-vscode](https://github.com/kieler/klighd-vscode) to add diagram support. You have to install
the extension locally if VS Code is not able to install the dependency automatically.

## Scripts

> All scripts that are available at the monorepo root. Run a script with `yarn <script>`.

| Script name | Description                                                                                 |
| :---------- | :------------------------------------------------------------------------------------------ |
| clean       | Removes all build results in each package.                                                  |
| lint        | Runs eslint in all packages to identify style problems.                                     |
| build       | Builds all packages for production.                                                         |
| watch       | Builds all packages for development in watch mode.                                          |
| package     | Builds and packages all packages for distribution. E.g. creates a `keith-vscode.vsix` file. |

## Developing the VS Code extension

We recommend VS Code to develop the VS Code extension to make use of the provided launch tasks. The
following steps have are required to start developing.

1. Fulfill the requirements above.
1. Install all
   [workspace recommended extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_recommended-extensions).
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run the "Launch VS Code Extension" launch configuration. This also runs a task to watch all packages.
1. A VS Code instance with the `keith-vscode` extension should be started.
1. After changes to your files, run the "Reload Window" command in your dev VS Code instance.

The launch configuration "Launch VS Code Extension (Socket)" can be used to connect to a Language Server
run in Eclipse. See the
[relevant documentation](https://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Running+KEITH#RunningKEITH-SettingupyourEclipse)
for more setup information.

## Locally install the VS Code extension

1. Fulfill the requirements above.
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run `yarn package`
1. Run `code --install-extension keith-vscode/keith-vscode.vsix`
