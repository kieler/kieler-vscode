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

import { TableWebview } from '@kieler/table-webview/lib/table-webview'
import * as path from 'path'
import * as vscode from 'vscode'
import { LanguageClient } from 'vscode-languageclient'
import { CompilationDataProvider } from '../kico/compilation-data-provider'
import { COMPILE_AND_SIMULATE } from '../simulation/commands'

import { SimulationTableDataProvider } from '../simulation/simulation-table-data-provider'
import { RELOAD_PROPERTIES_VERIFICATION, RUN_CHECKER_VERIFICATION, RUN_COUNTEREXAMPLE_VERIFICATION } from './commands'

// eslint-disable-next-line no-shadow
enum VerificationPropertyStatus {
    PENDING,
    RUNNING,
    PASSED,
    FAILED,
    EXCEPTION,
}

/**
 * Translates the a {@code VerificationPropertyStatus} into a string literal.
 *
 * @param status The {@code VerificationPropertyStatus}
 * @returns A string representation of the status. Returns 'Exception' if status is invalid.
 */
function statusToString(status: VerificationPropertyStatus) {
    switch (status) {
        case VerificationPropertyStatus.PENDING:
            return 'Pending'
        case VerificationPropertyStatus.RUNNING:
            return 'Running'
        case VerificationPropertyStatus.PASSED:
            return 'Passed'
        case VerificationPropertyStatus.FAILED:
            return 'Failed'
        default:
            return 'Exception'
    }
}

/**
 * Data class for a verification property.
 */
export class SmallVerificationProperty {
    id: string

    name: string

    formula: string

    status: number

    counterexampleUri: string

    constructor(id: string, name: string, formula: string, status: number, counterExample: string) {
        this.id = id
        this.name = name
        this.formula = formula
        this.status = status
        this.counterexampleUri = counterExample
    }
}

export const webviewLoadPropsMessageType = 'keith/verification/load-properties'
export const runCheckerMessageType = 'keith/verification/run-checker'
export const propertiesMessageType = 'keith/verification/properties'
export const updatePropertyStatusMessageType = 'keith/verification/update-property-status'

/**
 * Provider for the model checker table data.
 */
export class ModelCheckerDataProvider implements vscode.WebviewViewProvider {
    protected webview: TableWebview

    protected compiler: CompilationDataProvider

    protected props: SmallVerificationProperty[]

    protected selectedRow: string

    constructor(
        private lsClient: LanguageClient,
        compiler: CompilationDataProvider,
        readonly context: vscode.ExtensionContext,
        simulation: SimulationTableDataProvider
    ) {
        this.compiler = compiler
        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(propertiesMessageType, (propertyMsg) => {
                this.props = propertyMsg.properties
                this.handlePropertiesMessage(this.props)
            })
        })
        lsClient.onReady().then(() => {
            lsClient.onNotification(
                updatePropertyStatusMessageType,
                (id: string, status: VerificationPropertyStatus, counterexampleUri: string) => {
                    this.handleUpdatePropertyStatus(id, status)
                    const p = this.props.find((prop) => prop.id === id)
                    if (p && counterexampleUri !== '') {
                        p.counterexampleUri = counterexampleUri
                    }
                }
            )
        })

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RELOAD_PROPERTIES_VERIFICATION.command, async () => {
                await compiler.compile('de.cau.cs.kieler.sccharts.verification.nuxmv', true, false, false)
                this.lsClient.sendNotification(webviewLoadPropsMessageType, this.compiler.lastCompiledUri)
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_CHECKER_VERIFICATION.command, async () => {
                this.lsClient.sendNotification(runCheckerMessageType, this.compiler.lastCompiledUri)
            })
        )

        // TODO: only show run counterexample if prop is selected (see "simulationRunning")
        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_COUNTEREXAMPLE_VERIFICATION.command, async () => {
                vscode.commands.executeCommand(COMPILE_AND_SIMULATE.command)
                const selectedProp = this.props.find((prop) => prop.id === this.selectedRow)
                compiler.compilationFinished((success) => {
                    if (typeof success !== 'undefined' && success && selectedProp) {
                        const uri = vscode.Uri.parse(selectedProp.counterexampleUri)
                        simulation.loadTraceFromUri(uri)
                    }
                })
            })
        )
    }

    /**
     * Handles what should be done if a row in the table was selected.
     *
     * @param rowId The row id that was clicked.
     */
    clickedRow(rowId: string): void {
        this.selectedRow = rowId
    }

    /**
     * Handle a new property that was received.
     *
     * @param props The verification property.
     */
    private handlePropertiesMessage(props: SmallVerificationProperty[]) {
        this.webview.reset()
        props.forEach((prop) =>
            this.webview.addRow(
                prop.id,
                { cssClass: 'model-checker-name', value: prop.name },
                { cssClass: 'model-checker-formula', value: prop.formula }
            )
        )
    }

    /**
     * Updates the status of an existing verification property by updating the cell it is in.
     *
     * @param id The row id.
     * @param status The status of the verification property.
     */
    private handleUpdatePropertyStatus(id: string, status: VerificationPropertyStatus) {
        const prop = this.props.find((p) => p.id === id)
        if (prop) {
            prop.status = status
        }
        this.webview.updateCell(id, 'Result', { cssClass: 'model-checker-result', value: statusToString(status) })
    }

    /**
     * Creates the table webview.
     *
     * @param webviewView The webview.
     * @param context The context.
     * @param token The cancellation token.
     */
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        // Initialize webview
        const tWebview = new TableWebview(
            'Model Checker Table',
            [this.getExtensionFileUri('dist')],
            this.getExtensionFileUri('dist', 'verification-webview.js')
        )
        tWebview.webview = webviewView.webview
        tWebview.webview.options = {
            enableScripts: true,
        }
        const title = tWebview.getTitle()
        webviewView.title = title
        tWebview.initializeWebview(webviewView.webview, title, ['Name', 'Formula', 'Result'])
        this.webview = tWebview

        // Subscriptions
        this.context.subscriptions.push(
            this.webview.cellClicked((cell: { rowId: string; columnId: string } | undefined) => {
                if (cell && cell.rowId) {
                    this.clickedRow(cell.rowId)
                }
            })
        )

        this.webview.initialized(() => {
            this.initializeTable()
        })
    }

    /**
     * Initializes table view with header entries.
     */
    initializeTable() {
        // Initialize table
        this.webview.reset()
        this.props.forEach((entry) => {
            this.webview.addRow(
                entry.id,
                { cssClass: 'model-checker-name', value: entry.name },
                { cssClass: 'model-checker-formula', value: entry.formula },
                { cssClass: 'model-checker-result', value: statusToString(entry.status) }
            )
        })
    }

    /**
     * Returns the uri by joining given strings with the extension path.
     * Used to create the script uri for the webview.
     *
     * @param segments Path strings to join with the extension path.
     * @returns A uri.
     */
    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this.context.extensionPath, ...segments))
    }
}
