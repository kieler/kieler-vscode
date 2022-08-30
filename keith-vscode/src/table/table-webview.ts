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

export class TableWebview {

    static viewCount = 0;

    readonly identifier: string;

    webview: vscode.Webview;

    protected disposables: vscode.Disposable[] = [];

    protected title: string;

    protected headers: string[];

    constructor(identifier: string) {
        this.identifier = identifier;
    }

    createTitle() {
        return this.identifier;
    }

    async initializeWebview(webview: vscode.Webview, title: string, headers: string[]) {
        this.title = title;
        this.headers = headers;
        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${title}</title>
                    <style>
                        table, th, td {border: 1px solid black; border-collapse: collapse; padding: 5px;}
                    </style>
                </head>
                <body>
                    <div id="${this.identifier}_container" style="height: 100%;"></div>
                    <table id="${this.identifier}_table">
                        <tr>`;
        headers.forEach(head => webview.html += '<th>' + head + '</th>');
        webview.html += `</tr>
                    </table>
                </body>
            </html>`;
        this.webview = webview;
    }

    addRow(values: string[], id: string) {
        const endTableIndex = this.webview.html.indexOf("</table>");
        let row = "<tr id=" + id + ">";
        values.forEach(value => {
            const cell = "<td>" + value + "</td>";
            row += cell;
        });
        for (let i = values.length; i < this.headers.length; i++) {
            row += "<td></td>";
        }
        row += "</tr>";
        this.webview.html = this.webview.html.substring(0, endTableIndex) + row + this.webview.html.substring(endTableIndex, this.webview.html.length);
    }

    updateCell(rowId: string, columnId: string, value: string) {
        const col = this.headers.findIndex(c => c === columnId);
        const row = this.webview.html.indexOf("id=" + rowId);
        const splits = this.webview.html.substring(row).split(/(?<=<td>)/);
        const sp = splits[col+1]
        splits[col + 1] = value + sp.substring(sp.indexOf("</td>"));
        this.webview.html = this.webview.html.substring(0, row).concat(...splits);
    }

    reset() {
        this.initializeWebview(this.webview, this.title, this.headers);
    }

}