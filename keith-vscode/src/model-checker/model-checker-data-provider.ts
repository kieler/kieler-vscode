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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { CompilationDataProvider } from '../kico/compilation-data-provider';
import { TableWebview } from '../table/table-webview';
import { REALOD_PROPERTIES_VERIFICATION } from './commands';


export class SmallVerificationProperty {
    id: string;

    name: string;

    formula: string;

    status: number;

    constructor(id: string, name: string, formula: string, status: number) {
        this.id = id;
        this.name = name;
        this.formula = formula;
        this.status = status;
    }
}

export const webviewRdyMessageType = 'keith/verification/ready';
export const propertiesMessageType = 'keith/verification/properties';

export class ModelCheckerDataProvider implements vscode.WebviewViewProvider {

    protected webview: TableWebview;

    protected kico: CompilationDataProvider;

    constructor(
        private lsClient: LanguageClient,
        kico: CompilationDataProvider,
        readonly context: vscode.ExtensionContext
    ) {
        this.kico = kico
        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(propertiesMessageType, (props: SmallVerificationProperty[]) => {
                this.handlePropertiesMessage(props);
            });
        });

        this.context.subscriptions.push(
            vscode.commands.registerCommand(REALOD_PROPERTIES_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(webviewRdyMessageType, this.kico.lastCompiledUri);
            })
        )
    }

    handlePropertiesMessage(props: SmallVerificationProperty[]) {
        props.forEach(prop => this.webview.addRow([prop.name, prop.formula], prop.id));
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        const tWebview = new TableWebview(
            "Model Checker Table",
        );
        tWebview.webview = webviewView.webview;
        tWebview.webview.options = {
            enableScripts: true
        };
        const title = tWebview.createTitle();
        webviewView.title = title;
        tWebview.initializeWebview(webviewView.webview, title, ['Name', 'Formula', 'Result']);
        this.webview = tWebview;
    }

}