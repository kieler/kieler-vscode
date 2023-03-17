/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never

/**
 * Helper type to construct a tuple from a union.
 * @param T enum to transform into an union
 */
export type Tuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
    ? [...Tuple<Exclude<T, W>>, W]
    : []

    /**
 * Applys a workspaceedit to the document defined by {@code uri}, at the position {@code position} with the given {@code text}.
 * @param uri URI of the document where the edit should be applied.
 * @param text The text to insert in the document.
 * @param position The position in the document where the text should be inserted.
 */
export async function handleWorkSpaceEdit(uri: string, text: string, position: vscode.Position): Promise<void> {
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