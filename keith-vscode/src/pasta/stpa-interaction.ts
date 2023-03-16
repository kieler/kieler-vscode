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

/** Command identifiers that are provided by pasta. */
const pastaCommands = {
    getLTL: 'pasta.getLTLFormula',
    // sendModelCheckerResult: 'pasta.sendModelCheckerResult'
};

/**
 * Registers commands that interact with PASTA
 * @param context The extension context.
 */
export function registerStpaCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('keith-vscode.import-stpa-ltl', async (...commandArgs: any[]) => {
            importSTPALTL(commandArgs[0]);
        })
    );
}

/**
* Imports LTL formulas into the scchart given by {@code currentUri}. 
* @param currentUri The uri of the scchart in which the LTL should be imported.
*/
async function importSTPALTL(currentUri: vscode.Uri): Promise<void> {
    const stpaExtension = vscode.extensions.getExtension('kieler.pasta');
    if (stpaExtension) {
        // list of all available stpa files
        const options: vscode.QuickPickItem[] = [];
        const uris = await vscode.workspace.findFiles('**/*.stpa');
        const displays = uris.map(uri => vscode.workspace.asRelativePath(uri));
        for (let i = 0; i < uris.length; i++) {
            options.push({
                label: displays[i],
                description: uris[i].toString()
            });
        }
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
                    for (let i = 0; i < ltlFormulas.length; i++) {
                        formulas += ltlAnnotation(ltlFormulas[i].formula, ltlFormulas[i].text);
                    }
                    // add the annotations to the currently open scchart
                    handleWorkSpaceEdit(currentUri.toString(), formulas, new vscode.Position(0, 0));
                }
            }
            quickPick.hide();
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }
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

/**
 * Applys a workspaceedit to the document defined by {@code uri}, at the position {@code position} with the given {@code text}.
 * @param uri URI of the document where the edit should be applied.
 * @param text The text to insert in the document.
 * @param position The position in the document where the text should be inserted.
 */
async function handleWorkSpaceEdit(uri: string, text: string, position: vscode.Position): Promise<void> {
    // get the desired editor and document
    const editor = vscode.window.visibleTextEditors.find(visibleEditor => visibleEditor.document.uri.toString() === uri);
    const textDocument = editor?.document;
    if (!textDocument) {
        console.error(
            `Server requested a text edit but the requested uri was not found among the known documents: ${uri}`
        );
        return;
    }
    // create the insert workspaceedit
    const workSpaceEdit = new vscode.WorkspaceEdit();
    const edits: vscode.TextEdit[] = [vscode.TextEdit.insert(position, text)];
    workSpaceEdit.set(textDocument.uri, edits);

    // Apply and save the edit. Report possible failures.
    const edited = await vscode.workspace.applyEdit(workSpaceEdit);
    if (!edited) {
        console.error("Workspace edit could not be applied!");
        return;
    }

    if (editor) {
        // TODO: endPos is not completly correct. maybe \n must be counted too?
        // reveal the range of the inserted text
        const endPos = textDocument.positionAt(textDocument.offsetAt(position) + text.length);
        editor.selection = new vscode.Selection(position, endPos);
        editor.revealRange(new vscode.Range(position, endPos));
    }

    const saved = await textDocument.save();
    if (!saved) {
        console.error(`TextDocument ${textDocument.uri} could not be saved!`);
        return;
    }
}