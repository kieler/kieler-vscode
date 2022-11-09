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
import { Settings } from '../constants';
import { SettingsService } from '../settings';

export class LayoutPropertyDataProvider implements vscode.WebviewViewProvider {

    readonly onDidChangeOpenStateEmitter = new vscode.EventEmitter<boolean>()

    output: vscode.OutputChannel

    public layoutProperties: Map<string, string> = new Map()

    public static readonly viewType = 'kieler-layout-properties'

    private lsClient: LanguageClient

    protected table: TableWebview;

    protected disposables: vscode.Disposable[] = [];

    constructor(
        lsClient: LanguageClient,
        readonly context: vscode.ExtensionContext,
        private readonly settings: SettingsService<Settings>
    ) {
        // Output channel
        this.output = vscode.window.createOutputChannel('KIELER Layout Properties')
        this.output.appendLine(`[INFO]\t${'Layout properties view is created'}`)

        this.lsClient = lsClient
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        const tWebview = new TableWebview(
            "KIELER Properties",
            [
                this.getExtensionFileUri('dist')
            ],
            this.getExtensionFileUri('dist', 'layout-properties-webview.js'),
        );
        tWebview.webview = webviewView.webview;
        tWebview.webview.options = {
            enableScripts: true
        };
        const title = tWebview.createTitle();
        webviewView.title = title;
        tWebview.initializeWebview(webviewView.webview, title, ['Id', 'Value']);
        this.table = tWebview;
        this.context.subscriptions.push(
            // TODO meaybe also clicked cell
            this.table.cellClicked((cell: {rowId: string, columnId: string} | undefined ) => {
                if (cell && cell.rowId) {
                    this.clickedRow(cell.rowId)
                }
            })
        )
        this.table.initialized(() => {
            this.initializeTable()
        })
    }

    clickedRow(rowId: string): void {
        // TODO
    }

    dispose() {
        this.disposables.forEach(d => d.dispose())
        this.table.dispose()
    }

    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this.context.extensionPath, ...segments))
    }

    initializeTable() {
        // Initialize table
        this.table.reset()
        this.layoutProperties.forEach((key, propertyValue) => {
            this.table.addRow(key,
                { cssClass: 'layout-property-table-key', value: key },
                { cssClass: 'layout-property-table-value', value: propertyValue },
            )
        })
    }

    update(): void {
        this.layoutProperties.forEach((key, propertyValue) => {
            this.table.updateCell(key, 'Value', { cssClass: 'layout-property-table-value', value: propertyValue })
        })
    }
}