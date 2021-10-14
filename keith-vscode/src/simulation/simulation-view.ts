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
// /** @jsx svg */
// import { svg } from 'snabbdom-jsx'; // eslint-disable-line @typescript-eslint/no-unused-vars
// import * as React from 'react';
import * as vscode from 'vscode';
import { getNonce } from './helper';
import { SimulationWebViewProvider } from './simulation-view-provider';


export class SimulationWebView {

    private webview?: vscode.Webview

    private nonce: string

    constructor(private readonly viewProvider: SimulationWebViewProvider) {
    }

    getHtmlForSimulationView(webview: vscode.Webview): string {
        this.webview = webview
        this.viewProvider.kico.showButtons = true
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'src/simulation/style', 'index.css'));
		// const compilerStyĺeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'src/kico/style', 'index.css'));
		const script = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'dist', 'simulation-view-script.js'));

		// Use a nonce to only allow specific scripts to be run
		this.nonce = getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${this.nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleMainUri}" rel="stylesheet">
            <title>Cat Coding</title>
        </head>
        <body>
            <noscript>Please enable javascript</noscript>   
            <div id="simulation-container"></div>
            <script nonce="${this.nonce}" src="${script}"></script>
        </body>
        </html>`;
    }
}
