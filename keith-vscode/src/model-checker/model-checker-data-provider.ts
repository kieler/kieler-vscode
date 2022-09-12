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

import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { CompilationDataProvider } from '../kico/compilation-data-provider';
import { TableWebview } from '../table/table-webview';

import { REALOD_PROPERTIES_VERIFICATION, RUN_CHECKER_VERIFICATION } from './commands';

// eslint-disable-next-line no-shadow
enum VerificationPropertyStatus {
    PENDING,
    RUNNING,
    PASSED,
    FAILED,
    EXCEPTION
}

function statusToString(status: VerificationPropertyStatus) {
    switch (status) {
        case VerificationPropertyStatus.PENDING:
            return "Pending";
        case VerificationPropertyStatus.RUNNING:
            return "Running";
        case VerificationPropertyStatus.PASSED:
            return "Passed";
        case VerificationPropertyStatus.FAILED:
            return "Failed";
        default:
            return "Exception";
    }
}


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

export const webviewLoadPropsMessageType = 'keith/verification/loadProperties';
export const runCheckerMessageType = 'keith/verification/runChecker';
export const propertiesMessageType = 'keith/verification/properties';
export const updatePropertyStatusMessageTupe = 'keith/verification/updatePropertyStatus';

export class ModelCheckerDataProvider implements vscode.WebviewViewProvider {

    protected webview: TableWebview;

    protected kico: CompilationDataProvider;

    constructor(
        private lsClient: LanguageClient,
        kico: CompilationDataProvider,
        readonly context: vscode.ExtensionContext
    ) {
        this.kico = kico;
        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(propertiesMessageType, (props: SmallVerificationProperty[]) => {
                this.handlePropertiesMessage(props);
            });
        });
        lsClient.onReady().then(() => {
            lsClient.onNotification(updatePropertyStatusMessageTupe, (id: string, status: VerificationPropertyStatus) => {
                this.handleUpdatePropertyStatus(id, status);
            });
        });

        this.context.subscriptions.push(
            vscode.commands.registerCommand(REALOD_PROPERTIES_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(webviewLoadPropsMessageType, this.kico.lastCompiledUri);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_CHECKER_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(runCheckerMessageType, this.kico.lastCompiledUri);
            })
        );
    }

    private handlePropertiesMessage(props: SmallVerificationProperty[]) {
        //this.webview.reset();
        //props.forEach(prop => this.webview.addRow([prop.name, prop.formula], prop.id));
    }

    private handleUpdatePropertyStatus(id: string, status: VerificationPropertyStatus) {
        //this.webview.updateCell(id, "Result", statusToString(status));
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        const tWebview = new TableWebview(
            "Model Checker Table",
            [
                this.getExtensionFileUri('dist')
            ],
            this.getExtensionFileUri('dist', 'table-webview.js'),
        );
        tWebview.webview = webviewView.webview;
        tWebview.webview.options = {
            enableScripts: true
        };
        const title = tWebview.createTitle();
        webviewView.title = title;
        tWebview.initializeWebview(webviewView.webview, title, ['Name', 'Formula', 'Result']);
        tWebview.connect();
        this.webview = tWebview;
    }

    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri
            .file(path.join(this.context.extensionPath, ...segments));
    }

}