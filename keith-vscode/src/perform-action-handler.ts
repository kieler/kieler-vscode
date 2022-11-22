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
import { ADD_CO_SIMULATION, SIMULATE } from './simulation/commands'

// Take a look at the `klighd-vscode` extension for more documentation about action
// handlers.

// Action IDs defined by KLighD
const openInEditorId = 'de.cau.cs.kieler.kicool.ui.klighd.internal.model.action.OpenCodeInEditorAction'
const startSimulationId = 'de.cau.cs.kieler.simulation.ui.synthesis.action.StartSimulationAction'
const addCoSimulationId = 'de.cau.cs.kieler.simulation.ui.synthesis.action.AddCoSimulationAction'

/** Shape of the `PerformActionAction` object that is sent to LS by `klighd-vscode`. */
export interface PerformActionAction {
    kind: 'performAction'
    actionId: string
}

/** Action kind that should be intercepted by {@link handlePerformAction}. */
export const performActionKind = 'performAction'

/**
 * Action handler that is registered in `klighd-diagram` to catch and handle {@link PerformActionAction}.
 */
export async function handlePerformAction(action: PerformActionAction): Promise<boolean> {
    if (action.kind !== performActionKind) return true

    switch (action.actionId) {
        case openInEditorId:
            // TODO
            vscode.window.showInformationMessage('Triggered perform action to open in editor.')
            return false
        case startSimulationId:
            // TODO needs to be tested
            vscode.commands.executeCommand(SIMULATE.command)
            return false
        case addCoSimulationId:
            // TODO needs to be tested
            vscode.commands.executeCommand(ADD_CO_SIMULATION.command)
            return false
        default:
            return true
    }
}
