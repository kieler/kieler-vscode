/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import * as vscode from 'vscode';
import { extensionName, views } from '../constants';

export const SHOW_COMMAND: vscode.Command = {
    command: 'keith-vscode.show',
    title: 'Show Snapshot'
}

export const COMPILE_COMMAND: vscode.Command = {
    command: 'keith-vscode.compile',
    title: 'Compile'
}

export const COMPILE_SNAPSHOT_COMMAND: vscode.Command = {
    command: 'keith-vscode.compile-snapshot',
    title: 'Compile model in diagram'
}

export const SHOW_NEXT: vscode.Command = {
    command: 'keith-vscode.show-next',
    title: 'Show next'
}
export const SHOW_PREVIOUS: vscode.Command = {
    command: 'keith-vscode.show-previous',
    title: 'Show previous'
}
export const COMPILER: vscode.Command = {
    command: 'kico-compiler:toggle',
    title: 'Kico: Compiler'
}
export const REQUEST_CS: vscode.Command = {
    command: 'keith-vscode.request-compilation-systems',
    title: 'Request compilation systems'
}
export const TOGGLE_INPLACE: vscode.Command = {
    command: 'keith-vscode.inplace',
    title: 'Toggle inplace compilation'
}
/**
 * Show the resulting model after compile.
 * Never done on false or for simulation, done on compile if true.
 */
export const TOGGLE_SHOW_RESULTING_MODEL: vscode.Command = {
    command: 'keith-vscode.show-resulting-model',
    title: 'Toggle show model after compile'
}
export const TOGGLE_PRIVATE_SYSTEMS: vscode.Command = {
    command: 'keith-vscode.show-private-systems',
    title: 'Toggle show private systems'
}
export const TOGGLE_AUTO_COMPILE: vscode.Command = {
    command: 'keith-vscode.auto-compile',
    title: 'Toggle auto compile'
};

export const TOGGLE_BUTTON_MODE: vscode.Command = {
    command: 'keith-vscode.button-mode',
    title: 'Toggle button mode'
}


/**
 * Utility commands for focussing different views of the extension.
 * They are provided by default in the command palette, since VSCode automatically retrieves provided views from package.json.
 */

export const REVEAL_COMPILATION_WIDGET: vscode.Command = {
    command: `${views.compiler.id}.focus`,
    title: `Focus on ${views.compiler.name} View`
}

export const REVEAL_SIMULATION_WIDGET: vscode.Command = {
    command: `${views.simulation.id}.focus`,
    title: `Focus on ${views.simulation.name} View`
}

export const OPEN_KIELER_VIEW: vscode.Command = {
    command: `workbench.view.extension.${extensionName}`,
    title: 'Show KIELER'
}
