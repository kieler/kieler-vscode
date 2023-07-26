/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
import { GraphPropertiesDataProvider } from './graph-properties-view/graph-properties-data-provider'
import { ModelCheckerDataProvider } from './model-checker/model-checker-data-provider'
import { registerStpaCommands } from './pasta/stpa-interaction'
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

/**
 * All file endings of the languages that are supported by keith-vscode.
 * The file ending should also be the language id, since it is also used to
 * register document selectors in the language client.
 */
const supportedFileEndings = ['sctx', 'scl', 'elkt', 'elkj', 'kgt', 'kgx', 'kviz', 'strl', 'lus']

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
        // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.log('Spawning the language server as a process.')
    const lsPath = context.asAbsolutePath(`server/kieler-language-server.${getPlattformType()}.jar`)

    return {
        run: { command: 'java', args: ['-Djava.awt.headless=true', '-jar', lsPath] },
        debug: { command: 'java', args: ['-Djava.awt.headless=true', '-jar', lsPath] },
    }
}

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    registerStpaCommands(context)

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

    // Register and start model checker view
    const graphPropertiesDataProvider: vscode.WebviewViewProvider = new GraphPropertiesDataProvider(lsClient, context)
    vscode.window.registerWebviewViewProvider('kieler-graph-properties', graphPropertiesDataProvider)
    // eslint-disable-next-line no-console
    console.debug('Starting Language Server...')
    lsClient.start()

    // TODO save stuff in context e.g. commands.executeCommand("setContext", "var", value);
}
