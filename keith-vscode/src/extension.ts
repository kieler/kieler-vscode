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

import * as vscode from "vscode";
import {
    LanguageClient,
    ServerOptions,
    LanguageClientOptions,
    StreamInfo,
} from "vscode-languageclient";
import { connect, NetConnectOpts, Socket } from "net";
import { KeithErrorHandler } from "./error-handler";
import { performActionKind, handlePerformAction } from "./perform-action-handler";
import { CompilationDataProvider } from "./kico/compilation-data-provider";

//** Command identifiers that are provided by klighd-vscode. */
const klighdCommands = {
    setLanguageClient: "klighd-vscode.setLanguageClient",
    addActionHandler: "klighd-vscode.addActionHandler",
    dispatchAction: "klighd-vscode.dispatchAction",
};

/**
 * All file endings of the languages that are supported by keith-vscode.
 * The file ending should also be the language id, since it is also used to
 * register document selectors in the language client.
 */
const supportedFileEndings = ["sctx", "scl", "elkt", "kgt", "kviz", "strl", "lus"];

let lsClient: LanguageClient;
let socket: Socket;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const serverOptions: ServerOptions = createServerOptions(context);

    const clientOptions: LanguageClientOptions = {
        documentSelector: supportedFileEndings.map((ending) => ({
            scheme: "file",
            language: ending,
        })),
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.*"),
        },
    };

    lsClient = new LanguageClient("KIELER Language Server", serverOptions, clientOptions, true);

    // Setup basic connection error reporting
    const defaultErrorHandler = lsClient.createDefaultErrorHandler();
    lsClient.clientOptions.errorHandler = new KeithErrorHandler(defaultErrorHandler);

    // Inform the KLighD extension about the LS client and supported file endings.
    const refId = await vscode.commands.executeCommand<string>(
        klighdCommands.setLanguageClient,
        lsClient,
        supportedFileEndings
    );
    // Intercept PerformActionActions from klighd diagrams.
    vscode.commands.executeCommand(
        klighdCommands.addActionHandler,
        refId,
        performActionKind,
        handlePerformAction
    );

    const compilationDataProvider = new CompilationDataProvider(lsClient, context)

    // Register and start kico view
    vscode.window.registerTreeDataProvider(
        'kieler-kico',
        compilationDataProvider
    );
    vscode.window.createTreeView('kieler-kico', {
        treeDataProvider: compilationDataProvider
    });

    console.debug("Starting Language Server...");
    lsClient.start();
}

// this method is called when your extension is deactivated
export function deactivate(): Promise<void> {
    return new Promise<void>((resolve) => {
        if (socket) {
            // Don't call lsClient.stop when we are connected via socket for development.
            // That call will end the LS server, leading to a bad dev experience.
            socket.end(resolve);
            return;
        }
        lsClient?.stop().then(resolve);
    });
}

/**
 * Depending on the launch configuration, returns {@link ServerOptions} that either
 * connect to a socket or start the LS as a process. It uses a socket if the
 * environment variable `KEITH_LS_PORT` is present. Otherwise it runs the jar located
 * at `server/kieler-language-server.{platform}.jar`.
 */
function createServerOptions(context: vscode.ExtensionContext): ServerOptions {
    // Connect to language server via socket if a port is specified as an env variable
    if (typeof process.env.KEITH_LS_PORT !== "undefined") {
        const connectionInfo: NetConnectOpts = {
            port: parseInt(process.env.KEITH_LS_PORT, 10),
        };
        console.log("Connecting to language server on port: ", connectionInfo.port);

        return async () => {
            socket = connect(connectionInfo);
            const result: StreamInfo = {
                writer: socket,
                reader: socket,
            };
            return result;
        };
    } else {
        console.log("Spawning the language server as a process.");
        const lsPath = context.asAbsolutePath(
            `server/kieler-language-server.${getPlattformType()}.jar`
        );

        return {
            run: { command: "java", args: ["-jar", lsPath] },
            debug: { command: "java", args: ["-jar", lsPath] },
        };
    }
}

/** Returns the codename used by KIELER for current OS plattform. */
function getPlattformType(): "linux" | "win" | "osx" {
    switch (process.platform) {
        case "linux":
            return "linux";
        case "win32":
            return "win";
        case "darwin":
            return "osx";
        default:
            throw new Error(`Unknown plattform "${process.platform}".`);
    }
}
