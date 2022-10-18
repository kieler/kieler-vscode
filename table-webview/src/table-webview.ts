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

import * as vscode from 'vscode';
import { AddRowAction, AddRowListenerAction, ResetTableAction, SelectedRowAction, UpdateCellAction } from './actions';

export class TableWebview {

    protected disposables: vscode.Disposable[] = [];

    protected title: string;

    protected headers: string[];

    static viewCount = 0;

    readonly identifier: string;

    readonly localResourceRoots: vscode.Uri[];

    readonly scriptUri: vscode.Uri;

    webview: vscode.Webview;

    diagramPanel: vscode.WebviewPanel;

    private resolveWebviewReady: () => void;

    private readonly webviewReady = new Promise<void>((resolve) => (this.resolveWebviewReady = resolve))

    protected selectedRow: string;

    constructor(identifier: string, localResourceRoots: vscode.Uri[], scriptUri: vscode.Uri) {
        this.identifier = identifier;
        this.localResourceRoots = localResourceRoots;
        this.scriptUri = scriptUri;
    }

    ready(): Promise<void> {
        return this.webviewReady;
    }

    createTitle(): string {
        return this.identifier;
    }

    getSelectedRow() {
        return this.selectedRow
    }

    /**
     * Creates a diagram panel and initializes the webview.
     * @param headers Headers of the table.
     */
    protected createWebviewPanel(headers: string[]): void {
        const title = this.createTitle();
        const diagramPanel = vscode.window.createWebviewPanel('table', title, vscode.ViewColumn.Beside, {
            localResourceRoots: this.localResourceRoots,
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.initializeWebview(diagramPanel.webview, title, headers);
        this.diagramPanel = diagramPanel;
    }

    /**
     * Initializes the webview html and saves the headers.
     * @param webview The webview to initialize.
     * @param title The title of the webview.
     * @param headers The headers of the table.
     */
    async initializeWebview(webview: vscode.Webview, title: string, headers: string[]) {
        this.headers = headers
        // TODO: We should not require an internet connection and link to an external web page for this to load properly - fontawesome has some nicer ways to be embedded into Typescript code.
        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${title}</title>
                    <link
                        rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
                        integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
                        crossorigin="anonymous">
                </head>
                <body>
                    <div id="${this.identifier}_container" style="height: 100%;"></div>
                    <script> const vscode = acquireVsCodeApi();</script>
                    <script src="${webview.asWebviewUri(this.scriptUri).toString()}"></script>
                </body>
            </html>`;
        this.webview = webview;
        this.connect();
    }

    /**
     * Adds a row to the table.
     * @param values The values of the row in correct ordering.
     * @param rowId Id of the row to add.
     */
    async addRow(rowId: string, ...values: string[]) {
        await this.ready();
        const action = { kind: AddRowAction.KIND, rowId, values } as AddRowAction
        this.sendToWebview({ action });
    }

    /**
     * Updates a cells.
     * @param rowId The Id of the row of the cell.
     * @param columnId The id of the column of the cell.
     * @param value The new value for the cell.
     */
    async updateCell(rowId: string, columnId: string, value: string) {
        await this.ready();
        const action = { kind: UpdateCellAction.KIND, rowId, columnId, value } as UpdateCellAction;
        this.sendToWebview({ action });
    }

    /**
     * Resets the table to the headers.
     */
    async reset() {
        await this.ready();
        const action = { kind: ResetTableAction.KIND } as ResetTableAction;
        this.sendToWebview({ action });
    }

    /**
     * Adds a mouselistener for the selection of rows.
     */
    async addRowListener() {
        await this.ready();
        const action = { kind: AddRowListenerAction.KIND } as AddRowListenerAction;
        this.sendToWebview({ action });
    }

    /**
     * Registers listener for webview notifications.
     */
    protected async connect() {
        this.disposables.push(this.webview.onDidReceiveMessage((message) => this.receiveFromWebview(message)))
        await this.ready();
    }

    /**
     * Sends identifier to the webview.
     */
    protected async sendTableIdentifier() {
        await this.ready();
        this.sendToWebview({ identifier: this.identifier, headers: this.headers });
    }

    /**
     * Handles messages from the webview.
     * @param message The message received from the webview.
     */
    protected async receiveFromWebview(message: any): Promise<void> {
        if (message.readyMessage) {
            this.resolveWebviewReady();
            this.sendTableIdentifier();
        } else if (message.action) {
            if (SelectedRowAction.isThisAction(message.action)) {
                this.selectedRow = message.action.rowId
            }
        }
    }

    /**
     * Sends messages to the webview.
     * @param message The message to send.
     */
    sendToWebview(message: any) {
        this.webview.postMessage(message);
    }

}
