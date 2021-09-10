/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import * as vscode from 'vscode';

export const SAVE: vscode.Command = {
    command: 'core.save',
    title: 'Save'
};

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
    command: 'kico-request-compilation-systems',
    title: 'Kico: Request compilation systems'
}
export const TOGGLE_INPLACE: vscode.Command = {
    command: 'kico-toggle-inplace',
    title: 'Kico: Toggle inplace compilation'
}
/**
 * Show the resulting model after compile.
 * Never done on false or for simulation, done on compile if true.
 */
export const TOGGLE_SHOW_RESULTING_MODEL: vscode.Command = {
    command: 'kico-toggle-show-resulting-model',
    title: 'Kico: Toggle show model after compile'
}
export const TOGGLE_PRIVATE_SYSTEMS: vscode.Command = {
    command: 'kico-toggle-private-systems',
    title: 'Kico: Toggle show private systems'
}
export const TOGGLE_AUTO_COMPILE: vscode.Command = {
    command: 'kico-toggle-auto-compile',
    title: 'Kico: Toggle auto compile'
}

export const TOGGLE_BUTTON_MODE: vscode.Command = {
    command: 'kico-toggle-button-mode',
    title: 'Kico: Toggle button mode'
}

export const REVEAL_COMPILATION_WIDGET: vscode.Command = {
    command: 'kico-reveal-compilation-widget',
    title: 'Kico: Reveal compilation widget'
}