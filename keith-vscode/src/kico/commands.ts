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
    command: 'kico-show_next',
    title: 'Kico: Show next'
}
export const SHOW_PREVIOUS: vscode.Command = {
    command: 'kico-show_previous',
    title: 'Kico: Show previous'
}
export const COMPILER: vscode.Command = {
    command: 'kico-compiler:toggle',
    title: 'Kico: Compiler'
}
export const SELECT_COMPILATION_CHAIN: vscode.Command = {
    command: 'kico-select-compiler',
    title: 'Kico: Select compilation chain'
}
export const SELECT_SNAPSHOT_COMPILATION_CHAIN: vscode.Command = {
    command: 'kico-select-snapshot-compiler',
    title: 'Kico: Select snapshot compilation chain'
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

export const REVEAL_COMPILATION_WIDGET: vscode.Command = {
    command: 'kico-reveal-compilation-widget',
    title: 'Kico: Reveal compilation widget'
}

export const OPEN_KIELER_VIEW: vscode.Command = {
    command: 'keith-vscode.kieler-compiler',
    title: 'Open KIELER view'
}
