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
/**
 * Command to restart a simulation.
 */
 export const SIMULATE: vscode.Command = {
    command: 'keith-vscode.restart-simulation',
    title: 'Restart simulation'
}

export const COMPILE_AND_SIMULATE: vscode.Command = {
    command: 'keith-vscode.simulate',
    title: 'Simulate'
}

export const COMPILE_AND_SIMULATE_SNAPSHOT: vscode.Command = {
    command: 'keith-vscode.simulate-snapshot',
    title: 'Simulate snapshot'
}

export const OPEN_INTERNAL_KVIZ_VIEW: vscode.Command = {
    command: 'keith-vscode.open-kviz-internal',
    title: 'Open KViz view in internal browser preview'
}

export const OPEN_EXTERNAL_KVIZ_VIEW: vscode.Command = {
    command: 'keith-vscode.open-kviz-external',
    title: 'Open KViz view in external browser'
}

export const ADD_CO_SIMULATION: vscode.Command = {
    command: 'keith-vscode.add-co-simulation',
    title: 'Add Co-Simulation'
}

export const SELECT_SIMULATION_CHAIN: vscode.Command = {
    command: 'select-simulation-chain',
    title: 'Select simulation chain'
}

export const SELECT_SNAPSHOT_SIMULATION_CHAIN: vscode.Command = {
    command: 'select-snapshot-simulation-chain',
    title: 'Select snapshot simulation chain'
}

export const SET_SIMULATION_SPEED: vscode.Command = {
    command: 'set-simulation-speed',
    title: 'Set simulation speed'
}

export const REVEAL_SIMULATION_WIDGET: vscode.Command = {
    command: 'reveal-simulation-widget',
    title: 'Reveal simulation widget'
}