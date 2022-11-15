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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import * as vscode from 'vscode'
/**
 * Command to restart a simulation.
 */
export const SIMULATE: vscode.Command = {
    command: 'keith-vscode.simulation-restart',
    title: 'Restart simulation',
}

export const COMPILE_AND_SIMULATE: vscode.Command = {
    command: 'keith-vscode.simulate',
    title: 'Simulate',
}

export const COMPILE_AND_SIMULATE_SNAPSHOT: vscode.Command = {
    command: 'keith-vscode.simulate-snapshot',
    title: 'Simulate snapshot',
}

export const STOP_SIMULATION: vscode.Command = {
    command: 'keith-vscode.simulation-stop',
    title: 'Stop simulation',
}

export const STEP_SIMULATION: vscode.Command = {
    command: 'keith-vscode.simulation-step',
    title: 'Execute simulation step',
}

export const PAUSE_SIMULATION: vscode.Command = {
    command: 'keith-vscode.simulation-pause',
    title: 'Pause simulation',
}

export const RUN_SIMULATION: vscode.Command = {
    command: 'keith-vscode.simulation-run',
    title: 'Run simulation',
}

export const SAVE_TRACE: vscode.Command = {
    command: 'keith-vscode.simulation-save-trace',
    title: 'Save trace',
}

export const LOAD_TRACE: vscode.Command = {
    command: 'keith-vscode.simulation-load-trace',
    title: 'Load trace',
}

export const NEW_VALUE_SIMULATION: vscode.Command = {
    command: 'keith-vscode.simulation-new-value',
    title: 'New value for ...',
}

export const OPEN_INTERNAL_KVIZ_VIEW: vscode.Command = {
    command: 'keith-vscode.open-kviz-internal',
    title: 'Open KViz view in internal browser preview',
}

export const OPEN_EXTERNAL_KVIZ_VIEW: vscode.Command = {
    command: 'keith-vscode.open-kviz-external',
    title: 'Open KViz view in external browser',
}

export const ADD_CO_SIMULATION: vscode.Command = {
    command: 'keith-vscode.add-co-simulation',
    title: 'Add Co-Simulation',
}

export const SELECT_SIMULATION_CHAIN: vscode.Command = {
    command: 'select-simulation-chain',
    title: 'Select simulation chain',
}

export const SELECT_SNAPSHOT_SIMULATION_CHAIN: vscode.Command = {
    command: 'select-snapshot-simulation-chain',
    title: 'Select snapshot simulation chain',
}

export const SET_SIMULATION_SPEED: vscode.Command = {
    command: 'set-simulation-speed',
    title: 'Set simulation speed',
}

export const REVEAL_SIMULATION_WIDGET: vscode.Command = {
    command: 'reveal-simulation-widget',
    title: 'Reveal simulation widget',
}

export const SET_SIMULATION_STEP_DELAY: vscode.Command = {
    command: 'keith-vscode.simulation-step-delay',
    title: 'Set simulation step delay to ...',
}

export const SET_SIMULATION_TYPE_TO: vscode.Command = {
    command: 'keith-vscode.simulation-type',
    title: 'Set simulation type to ...',
}

export const SHOW_INTERNAL_VARIABLES: vscode.Command = {
    command: 'keith-vscode.show-internal-variables',
    title: 'Set display internal variables to ...',
}
