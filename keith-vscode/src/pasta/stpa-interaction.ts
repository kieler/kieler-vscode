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

import * as vscode from 'vscode';
import { handleWorkSpaceEdit } from '../util';

/** Command identifiers that are provided by pasta. */
const pastaCommands = {
    getLTL: 'pasta.getLTLFormula'
};

/**
 * Registers commands that interact with PASTA
 * @param context The extension context.
 */
export function registerStpaCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('keith-vscode.import-stpa-ltl', async (uri: vscode.Uri) => {
            importStpaLTL(uri);
        })
    );
}

/**
* Imports LTL formulas into the SCChart given by {@code currentUri}. 
* @param currentUri The uri of the scchart in which the LTL should be imported.
*/
async function importStpaLTL(currentUri: vscode.Uri): Promise<void> {
    const pastaExtension = vscode.extensions.getExtension('kieler.pasta');
    if (!pastaExtension) {
        vscode.window.showErrorMessage("PASTA Extension not found.");
        return;
    }
    // list of all available stpa files
    const options: vscode.QuickPickItem[] = [];
    const uris = await vscode.workspace.findFiles('**/*.stpa');
    const displays = uris.map(uri => vscode.workspace.asRelativePath(uri));
    uris.forEach((uri, i) => {
        options.push({ label: displays[i], description: uri.toString() });
    });
    // user must select the stpa file from which LTL formulas should be imported
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = options;
    quickPick.onDidChangeSelection(async (selection) => {
        if (selection[0]) {
            // get the ltl formulas from the pasta extension
            const ltlFormulas = await vscode.commands.executeCommand<{ formula: string, text: string, ucaId: string; }[]>(
                pastaCommands.getLTL,
                selection[0].description
            );
            if (ltlFormulas) {
                // translate the formulas to annotations for sccharts
                let formulas = "";
                ltlFormulas.forEach((ltlFormula) => {
                    formulas += ltlAnnotation(ltlFormula.formula, ltlFormula.text);
                });
                // add the annotations at the top of the currently open scchart
                handleWorkSpaceEdit(currentUri.toString(), formulas, new vscode.Position(0, 0));
            }
        }
        quickPick.hide();
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}

/**
 * An SCChart LTL annotation.
 * @param formula The formula for the annoation.
 * @param description The description for the annotation,
 * @returns the SCChart LTL annotation for the given arguments.
 */
const ltlAnnotation = (formula: string, description: string): string => {
    return "@LTL \"" + formula + "\", \"" + description + "\" \n";
};
