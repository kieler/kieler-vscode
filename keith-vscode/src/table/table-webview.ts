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

    constructor(identifier: string) {
        this.identifier = identifier;
    }

    createTitle() {
        return this.identifier;
    }

    async initializeWebview(webview: vscode.Webview, title: string, headers: string[]) {
        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${title}</title>
                    <style>
                        table, th, td {border: 1px solid white; border-collapse: collapse; padding: 5px;}
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
        let row = "<tr>";
        values.forEach(value => {
            const cell = "<td id =" + id + ">" + value + "</td>";
            row += cell;
        });
        row += "</tr>"
        this.webview.html = this.webview.html.substring(0, endTableIndex) + row + this.webview.html.substring(endTableIndex, this.webview.html.length);
    }

}