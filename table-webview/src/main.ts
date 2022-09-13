/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import '../css/index.css';
import { AddRowAction, AddRowListenerAction, ResetTableAction, UpdateCellAction } from './actions';
import { createCell, createRow, createTable, patch } from './html';
import { rowSelection } from './mouseListener';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Starter {

    protected identifier: string;
    protected headers: string[];

    constructor() {
        vscode.postMessage({ readyMessage: 'Template Webview ready' });
        console.log('Waiting for diagram identifier...');
        // add listener for messages
        const eventListener = (message: any) => {
            this.handleMessages(message);
        };
        window.addEventListener('message', eventListener);
    }

    /**
     * Handles incoming messages from the extension.
     * @param message The received Message.
     */
    protected handleMessages(message: any) {
        if (message.data.identifier) {
            this.initHtml(message.data.identifier, message.data.headers);
        } else if (message.data.action) {
            const action = message.data.action;
            if (AddRowAction.isThisAction(action)) {
                this.handleAddRow(action as AddRowAction);
            } else if (UpdateCellAction.isThisAction(action)) {
                this.handleUpdateCell(action as UpdateCellAction);
            } else if (ResetTableAction.isThisAction(action)) {
                this.handleResetTable();
            } else if (AddRowListenerAction.isThisAction(action)) {
                this.addRowListener()
            }
        } else {
            console.log("Message not supported: " + message);
        }
    }

    protected addRowListener() {
        document.addEventListener('click', event => {
            const action = rowSelection(event);
            if (action) {
                vscode.postMessage({ action: action });
            }
        });
    }

    /**
     * Initializes the webview with a header and a placeholder for the templates.
     * @param identifier The identifier of the element that should contain the webview.
     */
    protected initHtml(identifier: string, headers: string[]): void {
        this.identifier = identifier;
        this.headers = headers;
        const containerDiv = document.getElementById(identifier + '_container');
        if (containerDiv) {
            const tablePlaceholder = document.createElement("table");
            containerDiv.appendChild(tablePlaceholder);
            const table = createTable(identifier, headers);
            patch(tablePlaceholder, table);
        }
    }

    protected handleAddRow(action: AddRowAction) {
        const table = document.getElementById(this.identifier + '_table');
        if (table) {
            const rowPlaceholder = document.createElement("tr");
            table.appendChild(rowPlaceholder);
            const row = createRow(action.rowId, action.values);
            patch(rowPlaceholder, row);
        }
    }

    protected handleUpdateCell(action: UpdateCellAction) {
        const row = document.getElementById(action.rowId);
        const index = this.headers.indexOf(action.columnId);
        const newCell = createCell(action.value);
        if (index < row.children.length) {
            patch(row.children[index], newCell);
        } else {
            for (let i = row.children.length; i < index; i++) {
                const cell = document.createElement("td");
                row.appendChild(cell);
            }
            const cellPlaceholder = document.createElement("td");
            row.appendChild(cellPlaceholder);
            patch(cellPlaceholder, newCell);
        }
    }

    protected handleResetTable() {
        const table = document.getElementById(this.identifier + '_table');
        if (table) {
            const newTable = createTable(this.identifier, this.headers);
            patch(table, newTable);
        }
    }

}

new Starter();
