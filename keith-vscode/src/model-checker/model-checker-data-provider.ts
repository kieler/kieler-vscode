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

import { TableWebview } from '@kieler/table-webview/lib/table-webview';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { CompilationDataProvider } from '../kico/compilation-data-provider';
import { COMPILE_AND_SIMULATE } from '../simulation/commands';

import { SimulationTableDataProvider } from '../simulation/simulation-table-data-provider';
import { RELOAD_PROPERTIES_VERIFICATION, RUN_CHECKER_VERIFICATION, RUN_COUNTEREXAMPLE_VERIFICATION } from './commands';

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

    counterexampleUri: string

    constructor(id: string, name: string, formula: string, status: number, coutnerExample: string) {
        this.id = id;
        this.name = name;
        this.formula = formula;
        this.status = status;
        this.counterexampleUri = coutnerExample;
    }
}

export const webviewLoadPropsMessageType = 'keith/verification/load-properties';
export const runCheckerMessageType = 'keith/verification/run-checker';
export const propertiesMessageType = 'keith/verification/properties';
export const updatePropertyStatusMessageTupe = 'keith/verification/update-property-status';

export class ModelCheckerDataProvider implements vscode.WebviewViewProvider {

    protected webview: TableWebview;

    protected kico: CompilationDataProvider;

    protected props: SmallVerificationProperty[];

    protected selectedRow: string

    constructor(
        private lsClient: LanguageClient,
        kico: CompilationDataProvider,
        readonly context: vscode.ExtensionContext,
        simulation: SimulationTableDataProvider
    ) {
        this.kico = kico;
        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(propertiesMessageType, (propertyMsg) => {
                this.props = propertyMsg.properties;
                this.handlePropertiesMessage(this.props);
            });
        });
        lsClient.onReady().then(() => {
            lsClient.onNotification(updatePropertyStatusMessageTupe, (id: string, status: VerificationPropertyStatus, counterexampleUri: string) => {
                this.handleUpdatePropertyStatus(id, status);
                const p = this.props.find(prop => prop.id === id)
                if (p && counterexampleUri !== '') {
                    p.counterexampleUri = counterexampleUri
                }
            });
        });

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RELOAD_PROPERTIES_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(webviewLoadPropsMessageType, this.kico.lastCompiledUri);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_CHECKER_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(runCheckerMessageType, this.kico.lastCompiledUri);
            })
        );

        // TODO: check if a row is selected, otherwise show a notification to the user
        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_COUNTEREXAMPLE_VERIFICATION.command, async () => {
                vscode.commands.executeCommand(COMPILE_AND_SIMULATE.command);
                const p = this.props.find(prop => prop.id === this.selectedRow)
                kico.compilationFinished((success) => {
                    if (typeof success !== 'undefined' && success && p) {
                        const uri = vscode.Uri.parse(p.counterexampleUri)
                        simulation.loadTraceFromUri(uri)
                    }
                })
                // this.lsClient.sendNotification(runCounterexampleMessageType, [this.kico.lastCompiledUri, this.webview.getSelectedRow()]);
            })
        );
        
    }

    clickedRow(rowId: string): void {
        this.selectedRow = rowId
    }

    private handlePropertiesMessage(props: SmallVerificationProperty[]) {
        this.webview.reset();
        props.forEach(prop => this.webview.addRow(prop.id, prop.name, prop.formula));
    }

    private handleUpdatePropertyStatus(id: string, status: VerificationPropertyStatus) {
        this.webview.updateCell(id, "Result", statusToString(status));
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        const tWebview = new TableWebview(
            "Model Checker Table",
            [
                this.getExtensionFileUri('dist')
            ],
            this.getExtensionFileUri('dist', 'verification-webview.js'),
        );
        tWebview.webview = webviewView.webview;
        tWebview.webview.options = {
            enableScripts: true
        };
        const title = tWebview.createTitle();
        webviewView.title = title;
        tWebview.initializeWebview(webviewView.webview, title, ['Name', 'Formula', 'Result']);
        // tWebview.addRowListener();
        this.webview = tWebview;

        this.context.subscriptions.push(
            this.webview.rowClicked((rowId: string | undefined ) => {
                if (rowId) {
                    this.clickedRow(rowId)
                }
            })
        )
    }

    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri
            .file(path.join(this.context.extensionPath, ...segments));
    }

}