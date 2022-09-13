/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
/* eslint-disable no-return-assign */
/* eslint-disable prefer-template */
/* eslint-disable prettier/prettier */
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

    private resolveWebviewReady: () => void;

    private readonly webviewReady = new Promise<void>((resolve) => this.resolveWebviewReady = resolve);

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

    async initializeWebview(webview: vscode.Webview, title: string, headers: string[]) {
        this.headers = headers
        // TODO: headers should be able by sending the webview a msg
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
    }

    async addRow(values: string[], rowId: string) {
        await this.ready();
        const action = { kind: AddRowAction.KIND, rowId,  values} as AddRowAction;
        this.sendToWebview({ action });
    }

    async updateCell(rowId: string, columnId: string, value: string) {
        await this.ready();
        const action = { kind: UpdateCellAction.KIND, rowId,  columnId, value} as UpdateCellAction;
        this.sendToWebview({ action });
    }

    async reset() {
        await this.ready();
        const action = { kind: ResetTableAction.KIND } as ResetTableAction;
        this.sendToWebview({ action });
    }

    async addRowListener() {
        await this.ready();
        const action = { kind: AddRowListenerAction.KIND } as AddRowListenerAction;
        this.sendToWebview({ action });
    }

    /**
     * Registers listeners.
     */
    async connect() {
        this.disposables.push(this.webview.onDidReceiveMessage(message => this.receiveFromWebview(message)));
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
    protected async receiveFromWebview(message: any) {
        console.log("Received from template webview");
        if (message.readyMessage) {
            this.resolveWebviewReady();
            this.sendTableIdentifier();
        }else if (message.action) {
            if (SelectedRowAction.isThisAction(message.action)) {
                this.selectedRow = message.action.rowId
            }
        }
    }

    sendToWebview(message: any) {
        this.webview.postMessage(message);
    }

}