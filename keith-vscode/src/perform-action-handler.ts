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

import { window } from "vscode";

// Action IDs defined by KLighD
const openInEditorId =
    "de.cau.cs.kieler.kicool.ui.klighd.internal.model.action.OpenCodeInEditorAction";
const startSimulationId = "de.cau.cs.kieler.simulation.ui.synthesis.action.StartSimulationAction";
const addCoSimulationId = "de.cau.cs.kieler.simulation.ui.synthesis.action.AddCoSimulationAction";

/** Shape of the `PerformActionAction` object that is sent to LS by `klighd-vscode`. */
interface PerformActionAction {
    kind: "performAction";
    actionId: string;
}

/** Action kind that should be intercepted by {@link handlePerformAction}. */
export const performActionKind = "performAction";

/**
 * Action handler that is registered in `klighd-diagram` to catch and handle {@link PerformActionAction}.
 */
export async function handlePerformAction(action: PerformActionAction): Promise<boolean> {
    if (action.kind !== performActionKind) return true;

    switch (action.actionId) {
        case openInEditorId:
            window.showInformationMessage("Triggered perform action to open in editor.");
            return false;
        case startSimulationId:
            window.showInformationMessage("Triggered perform action to start a simulation.");
            return false;
        case addCoSimulationId:
            window.showInformationMessage("Triggered perform action to add a Co Simulation");
            return false;
        default:
            return true;
    }
}
