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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { connect, NetConnectOpts, Socket } from 'net'
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from 'vscode-languageclient'
import { Settings, settingsKey } from './constants'
import { KeithErrorHandler } from './error-handler'
import { CompilationDataProvider } from './kico/compilation-data-provider'
import { ModelCheckerDataProvider } from './model-checker/model-checker-data-provider'
import { handlePerformAction, performActionKind } from './perform-action-handler'
import { SettingsService } from './settings'
import { SimulationTableDataProvider } from './simulation/simulation-table-data-provider'
// import 'simulation/index.css'

/** Command identifiers that are provided by klighd-vscode. */
const klighdCommands = {
    setLanguageClient: 'klighd-vscode.setLanguageClient',
    addActionHandler: 'klighd-vscode.addActionHandler',
    dispatchAction: 'klighd-vscode.dispatchAction',
}

/** Command identifiers that are provided by pasta. */
const pastaCommands = {
    getLTL: 'pasta.getLTLFormula',
    sendModelCheckerResult: 'pasta.sendModelCheckerResult'
}

/**
 * All file endings of the languages that are supported by keith-vscode.
 * The file ending should also be the language id, since it is also used to
 * register document selectors in the language client.
 */
const supportedFileEndings = ['sctx', 'scl', 'elkt', 'kgt', 'kgx', 'kviz', 'strl', 'lus']

let lsClient: LanguageClient
let socket: Socket
let settingsService: SettingsService<Settings>

// this method is called when your extension is deactivated
export function deactivate(): Promise<void> {
    return new Promise<void>((resolve) => {
        if (socket) {
            // Don't call lsClient.stop when we are connected via socket for development.
            // That call will end the LS server, leading to a bad dev experience.
            socket.end(resolve)
            return
        }
        lsClient?.stop().then(resolve)
    })
}

/** Returns the codename used by KIELER for current OS plattform. */
function getPlattformType(): 'linux' | 'win' | 'osx' {
    switch (process.platform) {
        case 'linux':
            return 'linux'
        case 'win32':
            return 'win'
        case 'darwin':
            return 'osx'
        default:
            throw new Error(`Unknown plattform "${process.platform}".`)
    }
}

/**
 * Depending on the launch configuration, returns {@link ServerOptions} that either
 * connect to a socket or start the LS as a process. It uses a socket if the
 * environment variable `KEITH_LS_PORT` is present. Otherwise it runs the jar located
 * at `server/kieler-language-server.{platform}.jar`.
 */
function createServerOptions(context: vscode.ExtensionContext): ServerOptions {
    // Connect to language server via socket if a port is specified as an env variable
    if (typeof process.env.KEITH_LS_PORT !== 'undefined') {
        const connectionInfo: NetConnectOpts = {
            port: parseInt(process.env.KEITH_LS_PORT, 10),
        }
        console.log('Connecting to language server on port: ', connectionInfo.port)

        return async () => {
            socket = connect(connectionInfo)
            const result: StreamInfo = {
                writer: socket,
                reader: socket,
            }
            return result
        }
    }
    console.log('Spawning the language server as a process.')
    const lsPath = context.asAbsolutePath(`server/kieler-language-server.${getPlattformType()}.jar`)

    return {
        run: { command: 'java', args: ['-Djava.awt.headless=true', '-jar', lsPath] },
        debug: { command: 'java', args: ['-Djava.awt.headless=true', '-jar', lsPath] },
    }
}

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext): Promise<void> {

    context.subscriptions.push(
        vscode.commands.registerCommand('keith-vscode.import-stpa-ltl', async (...commandArgs: any[]) => {
            importSTPALTL(commandArgs[0]);
        })
    );

    const serverOptions: ServerOptions = createServerOptions(context)

    const clientOptions: LanguageClientOptions = {
        documentSelector: supportedFileEndings.map((ending) => ({
            scheme: 'file',
            language: ending,
        })),
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.*'),
        },
    }

    lsClient = new LanguageClient('KIELER Language Server', serverOptions, clientOptions, true)

    // Setup basic connection error reporting
    const defaultErrorHandler = lsClient.createDefaultErrorHandler()
    lsClient.clientOptions.errorHandler = new KeithErrorHandler(defaultErrorHandler)

    // Inform the KLighD extension about the LS client and supported file endings.
    const refId = await vscode.commands.executeCommand<string>(
        klighdCommands.setLanguageClient,
        lsClient,
        supportedFileEndings
    )
    // Intercept PerformActionActions from klighd diagrams.
    vscode.commands.executeCommand(klighdCommands.addActionHandler, refId, performActionKind, handlePerformAction)

    // create SettingsService with list of setting-keys to manage
    settingsService = new SettingsService<Settings>(settingsKey, [
        'autocompile.enabled',
        'compileInplace.enabled',
        'showResultingModel.enabled',
        'showButtons.enabled',
        'showPrivateSystems.enabled',
        'simulationStepDelay',
        'simulationType',
        'showInternalVariables.enabled',
    ])

    const compilationDataProvider = new CompilationDataProvider(lsClient, context, settingsService)

    // Register and start kico view
    vscode.window.registerTreeDataProvider('kieler-kico', compilationDataProvider)
    vscode.window.createTreeView('kieler-kico', {
        treeDataProvider: compilationDataProvider,
    })

    // Register and start simulation table view
    const simulationDataProvider: SimulationTableDataProvider = new SimulationTableDataProvider(
        lsClient,
        compilationDataProvider,
        context,
        settingsService
    )
    vscode.window.registerWebviewViewProvider('kieler-simulation-table', simulationDataProvider)

    // Register and start model checker view
    const modelCheckerDataProvider: vscode.WebviewViewProvider = new ModelCheckerDataProvider(
        lsClient,
        compilationDataProvider,
        context,
        simulationDataProvider
    )
    vscode.window.registerWebviewViewProvider('kieler-model-checker', modelCheckerDataProvider)

    console.debug('Starting Language Server...')
    lsClient.start()

    // TODO save stuff in context e.g. commands.executeCommand("setContext", "var", value);
}


/**
 * Applys a workspaceedit to the document defined by {@code uri}, at the position {@code position} with the given {@code text}.
 * @param uri URI of the document where the edit should be applied.
 * @param text The text to insert in the document.
 * @param position The position in the document where the text should be inserted.
 */
 async function handleWorkSpaceEdit(uri: string, text: string, position: vscode.Position): Promise<void> {
    // get the desired editor and document
    const editor = vscode.window.visibleTextEditors.find(visibleEditor => visibleEditor.document.uri.toString() === uri)
    const textDocument = editor?.document
    if (!textDocument) {
        console.error(
            `Server requested a text edit but the requested uri was not found among the known documents: ${uri}`
        );
        return
    }
    // create the insert workspaceedit
    const workSpaceEdit = new vscode.WorkspaceEdit()
    const edits: vscode.TextEdit[] = [vscode.TextEdit.insert(position, text)]
    workSpaceEdit.set(textDocument.uri, edits)

    // Apply and save the edit. Report possible failures.
    const edited = await vscode.workspace.applyEdit(workSpaceEdit)
    if (!edited) {
        console.error("Workspace edit could not be applied!")
        return
    }

    if (editor) {
        // TODO: endPos is not completly correct. maybe \n must be counted too?
        // reveal the range of the inserted text
        const endPos = textDocument.positionAt(textDocument.offsetAt(position) + text.length)
        editor.selection = new vscode.Selection(position, endPos)
        editor.revealRange(new vscode.Range(position, endPos))
    }

    await textDocument.save()
}

/**
 * Imports LTL formulae into the scchart given by {@code currentUri}. 
 * @param currentUri The uri of the scchart in which the LTL should be imported.
 */
async function importSTPALTL(currentUri: vscode.Uri): Promise<void> {
    const stpaExtension = vscode.extensions.getExtension('kieler.pasta')
    if (stpaExtension) {
        // list of all available stpa files
        const options: vscode.QuickPickItem[] = []
        const uris = await vscode.workspace.findFiles('**/*.stpa')
        const displays = uris.map(uri => vscode.workspace.asRelativePath(uri))
        for (let i = 0; i < uris.length; i++) {
            options.push({
                label: displays[i],
                description: uris[i].toString()
            })
        }
        // user must select the stpa file from which LTLs should be imported
        const quickPick = vscode.window.createQuickPick()
        quickPick.items = options
        quickPick.onDidChangeSelection(async (selection) => {
            if (selection[0]) {
                // get the ltl formulae from the pasta extension
                const ltlFormulas = await vscode.commands.executeCommand<{formula: string, text: string, ucaId: string}[]>(
                    pastaCommands.getLTL,
                    selection[0].description
                )
                if (ltlFormulas) {
                    // translate the formulas to annotations for sccharts
                    let formulas = "";
                    for (let i = 0; i < ltlFormulas.length; i++) {
                        if (i != 0) {
                            formulas +="\n"
                        }
                        formulas +="@LTL \"" + ltlFormulas[i].formula + "\", \"" + ltlFormulas[i].text + "\""
                    }
                    // add the annotations to the currently open scchart
                    handleWorkSpaceEdit(currentUri.toString(), formulas, new vscode.Position(0,0))
                }
            }
            quickPick.hide()
        })
        quickPick.onDidHide(() => quickPick.dispose())
        quickPick.show()
    }
}
