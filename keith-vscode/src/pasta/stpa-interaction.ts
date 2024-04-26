/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
import { handleWorkSpaceEdit } from '../util'

/** Command identifiers that are provided by pasta. */
const pastaCommands = {
    getLTL: 'pasta.getLTLFormula',
}

/**
 * Respresents an LTL formula.
 */
class LTLFormula {
    formula: string

    description: string

    ucaId: string
}

/**
 * Registers commands that interact with PASTA
 * @param context The extension context.
 */
export function registerStpaCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('keith-vscode.import-stpa-ltl', async (uri: vscode.Uri) => {
            importStpaLTL(uri)
        })
    )
}

/**
 * Imports LTL formulas into the SCChart given by {@code currentUri}.
 * @param currentUri The uri of the scchart in which the LTL should be imported.
 */
async function importStpaLTL(currentUri: vscode.Uri): Promise<void> {
    const pastaExtension = vscode.extensions.getExtension('kieler.pasta')
    if (!pastaExtension) {
        vscode.window.showErrorMessage('PASTA Extension not found.')
        return
    }

    // Loading the stpa file.
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { STPA: ['stpa'] },
    })
    if (uris === undefined) {
        // The user did not pick any file to load.
        return
    }

    // get the ltl formulas from the pasta extension
    const ltlFormulas = await vscode.commands.executeCommand<
        Record<string, { formula: string; description: string; ucaId: string }[]>
    >(pastaCommands.getLTL, uris[0].toString())
    if (ltlFormulas && Object.keys(ltlFormulas).length !== 0) {
        // user must choose for which controller ltl formulas should be imported
        showQuickPick(ltlFormulas, currentUri)
    }
}

/**
 * Shows a quickpick menu with the controllers (keys) of {@code ltlFormulasMap}.
 * @param ltlFormulasMap Map that contains the ltlformulas for each controller.
 * @param currentUri The uri of the scchart in which the LTL should be imported.
 */
function showQuickPick(ltlFormulasMap: Record<string, LTLFormula[]>, currentUri: vscode.Uri): void {
    // create a list with the controller names
    const quickPick = vscode.window.createQuickPick()
    const itemList = []
    for (const key of Object.keys(ltlFormulasMap)) {
        itemList.push({ label: key })
    }
    quickPick.items = itemList

    // show quickpick
    quickPick.onDidChangeSelection((selection) => {
        if (selection[0]) {
            // add ltl formulas for selected controller
            addLTLToFile(ltlFormulasMap, selection[0].label, currentUri)
        }
        quickPick.hide()
    })
    quickPick.onDidHide(() => quickPick.dispose())
    quickPick.show()
}

/**
 * Adds LTL formulas for the given {@code controller}.
 * @param ltlFormulasMap Map containing the ltl formulas for each controller.
 * @param controller The controller which ltl fomrulas should be imported.
 * @param currentUri The uri of the scchart in which the LTL should be imported.
 */
function addLTLToFile(ltlFormulasMap: Record<string, LTLFormula[]>, controller: string, currentUri: vscode.Uri): void {
    const ltlFormulas = ltlFormulasMap[controller]
    if (ltlFormulas) {
        // translate the formulas to annotations for sccharts
        let formulas = ''
        ltlFormulas.forEach((ltlFormula) => {
            formulas += ltlAnnotation(ltlFormula.formula, ltlFormula.description, ltlFormula.ucaId)
        })
        // add the annotations at the top of the currently open scchart
        handleWorkSpaceEdit(currentUri.toString(), formulas, new vscode.Position(0, 0))
    }
}

/**
 * An SCChart LTL annotation.
 * @param formula The formula for the annoation.
 * @param description The description for the annotation,
 * @returns the SCChart LTL annotation for the given arguments.
 */
const ltlAnnotation = (formula: string, description: string, ucaID: string): string =>
    `@LTL "${formula}", "${description}", "${ucaID}" \n`
