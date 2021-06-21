# KEITH VSCode

> This extensions brings the KIELER project to VSCode!

## Features

-   Support for SCCharts
-   Support for Elk Graph
-   Support for KGraph
-   Support for Kieler Visualization
-   Support for Estrel
-   Support for Lustre
-   Visualizing supported languages with diagrams

## Requirements

This extension requires an installation of Java 11 to be available on your PATH.

## Known Issues

-   `keith-vscode` has a dependency on `klighd-vscode` to support diagrams. However, currently only
    one extension with a dependency on `klighd-vscode` can be active at the same time. If this is a
    problem, close all files that are not supported by this extension and reload the vscode window.
    Afterwards, only open files that are supported by this extension so no other klighd-vscode`
    dependent extension is activated.
