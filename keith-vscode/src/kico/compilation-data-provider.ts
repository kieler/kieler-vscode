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

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { COMPILE_COMMAND, COMPILE_SNAPSHOT_COMMAND, OPEN_KIELER_VIEW, REQUEST_CS, SHOW_COMMAND, SHOW_NEXT, SHOW_PREVIOUS } from './commands';
import { Utils } from 'vscode-uri';
export const compilerWidgetId = "compiler-widget"
export const COMPILE = 'keith/kicool/compile'
export const CANCEL_COMPILATION = "keith/kicool/cancel-compilation"
export const SHOW = 'keith/kicool/show'
export const GET_SYSTEMS = 'keith/kicool/get-systems'

export const OPEN_COMPILER_WIDGET_KEYBINDING = "ctrlcmd+alt+c"
export const SHOW_PREVIOUS_KEYBINDING = "alt+g"
export const SHOW_NEXT_KEYBINDING = "alt+j"

export const EDITOR_UNDEFINED_MESSAGE = "Editor is undefined"
export const snapshotDescriptionMessageType = 'keith/kicool/compile';
export const cancelCompilationMessageType = 'keith/kicool/cancel-compilation';
export const compilationSystemsMessageType = 'keith/kicool/compilation-systems';

export const diagramType = "keith-diagram"

export class CompilationDataProvider implements vscode.TreeDataProvider<CompilationData> {
    editor: vscode.TextEditor | undefined = undefined;
    requestedSystems = false;
    systems: CompilationSystem[] = [];
    snapshotSystems: CompilationSystem[] = [];
    quickpickSystems: vscode.QuickPickItem[] = [];
    kicoCommands: vscode.Disposable[] = [];
    // TODO collect all listeners and commands here and dispose this on dispose of this provider
    compileInplace = false;
    showResultingModel = true;
    startTime = 0;
    endTime = 0;
    compiling = false;
    lastInvokedCompilation = '';
    lastCompiledUri = '';
    sourceModelPath = ''; // Set when editor is changed to current uri
    autoCompile = false;

    requestSystems: vscode.StatusBarItem
    compilation: vscode.StatusBarItem
    output: vscode.OutputChannel

    /**
     * The file extension of the last file for which compilation systems where requested.
     */
    public lastRequestedUriExtension = '';

    /**
     * Indicates that a compilation is currently being cancelled
     */
    public cancellingCompilation = false;

    /**
     * Snapshots that are currently shown in the view, created during compilation.
     */
    snapshots: CodeContainer | undefined = undefined;

    isCompiled: Map<string, boolean> = new Map;
    sourceURI: Map<string, string> = new Map;
    resultMap: Map<string, CodeContainer> = new Map;
    indexMap: Map<string, number> = new Map;
    lengthMap: Map<string, number> = new Map;
    /**
     * Show some option toggle buttons
     */
    public showButtons = false

    public readonly compilationStartedEmitter = new vscode.EventEmitter<this | undefined>()
    /**
     * Finish of compilation is recognized by cancel of compilation or by receiving a snapshot that is the last of the compilation system.
     * Returns whether compilation has successfully finished (the last snapshot was send).
     */
    public readonly compilationFinishedEmitter = new vscode.EventEmitter<boolean | undefined>()
    public readonly showedNewSnapshotEmitter = new vscode.EventEmitter<string | undefined>()
    public readonly newSimulationCommandsEmitter = new vscode.EventEmitter<CompilationSystem[]>()

    public readonly compilationStarted: vscode.Event<this | undefined> = this.compilationStartedEmitter.event
    /**
     * Finish of compilation is recognized by cancel of compilation or by receiving a snapshot that is the last of the compilation system.
     * Returns whether compilation has successfully finished (the last snapshot was send).
     */
    public readonly compilationFinished: vscode.Event<boolean | undefined> = this.compilationFinishedEmitter.event
    public readonly showedNewSnapshot: vscode.Event<string | undefined> = this.showedNewSnapshotEmitter.event
    public readonly newSimulationCommands: vscode.Event<CompilationSystem[]> = this.newSimulationCommandsEmitter.event

    constructor(private lsClient: LanguageClient, readonly context: vscode.ExtensionContext) {

        // Output channel
		this.output = vscode.window.createOutputChannel('KIELER Compilation');

        // TODO call treeview.reveal(item, {focus: true}); to reveal tree view after compilation finished
        // The item that is revealed should maybe be the last one. Also this provider may need access to the tree view.

        // Status bar item for compilation
        this.requestSystems = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        this.requestSystems.command = REQUEST_CS.command
        this.context.subscriptions.push(this.requestSystems)
        this.compilation = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        this.compilation.command = OPEN_KIELER_VIEW.command
        this.context.subscriptions.push(this.compilation)

        // Bind notifications to receive
        lsClient.onReady().then(() => {
            lsClient.onNotification(compilationSystemsMessageType, (systems: CompilationSystem[], snapshotSystems: CompilationSystem[]) => {
                this.handleReceiveSystemDescriptions(systems, snapshotSystems)
            });
            lsClient.onNotification(snapshotDescriptionMessageType, (snapshotsDescriptions: CodeContainer, uri: string, finished: boolean, currentIndex: number, maxIndex: number) => {
                this.handleNewSnapshotDescriptions(snapshotsDescriptions, uri, finished, currentIndex, maxIndex)
            });
        });
        // Bind to change active editor event
        this.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
            this.onDidChangeActiveTextEditor(editor)
        }));
        // Request compilation systems at the start, since onDidChangeActiveTextEditor does not fire at the beginning
        const editor = vscode.window.activeTextEditor
        if (editor) {
            this.onDidChangeActiveTextEditor(editor)
        }

        // Create commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand(SHOW_COMMAND.command, async (snapshot) => {
                this.show(this.lastCompiledUri, snapshot.index)
            }, this));

        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_COMMAND.command, async () => {
                const options = this.createQuickPick(this.systems)
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = options;
                quickPick.onDidChangeSelection(selection => {
                    if (selection[0]) {
                        this.systems.forEach(system => {
                            if (system.label === selection[0].label) {
                                this.compile(system.id, this.compileInplace, this.showResultingModel, system.snapshotSystem)
                            }
                        })
                    }
                    quickPick.hide()
                });
                quickPick.onDidHide(() => quickPick.dispose());
                quickPick.show();
                
            }));
    
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_SNAPSHOT_COMMAND.command, async () => {
                const options = this.createQuickPick(this.snapshotSystems)
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = options;
                quickPick.onDidChangeSelection(selection => {
                    if (selection[0]) {
                        this.snapshotSystems.forEach(system => {
                            if (system.label === selection[0].label) {
                                this.compile(system.id, this.compileInplace, this.showResultingModel, system.snapshotSystem)
                            }
                        })
                    }
                    quickPick.hide()
                });
                quickPick.onDidHide(() => quickPick.dispose());
                quickPick.show();
                
            }));
    }

    createQuickPick(systems: CompilationSystem[]): vscode.QuickPickItem[] {
        const quickPicks: vscode.QuickPickItem[] = []
        systems.forEach(system => {
            quickPicks.push({
                label: system.label
            })
        });
        return quickPicks;
    }

    /**
     * Message of the server to notify the client what compilation systems are available
     * to compile the original model and the currently opened snapshot.
     * @param systems compilation systems for original model
     * @param snapshotSystems compilation systems for currently opened snapshot
     */
    handleReceiveSystemDescriptions(systems: CompilationSystem[], snapshotSystems: CompilationSystem[]): void {
        // Remove status bar element after successfully requesting systems
        this.requestSystems.hide()
        // Sort all compilation systems by id
        systems.sort((a, b) => (a.id > b.id) ? 1 : -1)
        this.systems = systems
        this.snapshotSystems = snapshotSystems
        if (this.editor) {
            this.sourceModelPath = this.editor.document.uri.toString()
            this.lastRequestedUriExtension = Utils.extname(this.editor.document.uri)
        }
        this.requestedSystems = false

        const simulationSystems = systems.filter(system => system.simulation)
        // Register additional simulation commands
        this.newSimulationCommandsEmitter.fire(simulationSystems)
    }

    async onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
        if (editor && editor.document.uri.scheme === "file") {
            this.lsClient.onReady().then(() => {
                console.log()
                this.editor = editor
                this.requestSystemDescriptions()
            })
        }
    }

    async requestSystemDescriptions(): Promise<void> {
        if (this.editor) {
            // when systems are requested request systems status bar entry is updated
            this.requestSystems.text = '$(spinner) Request compilation systems',
            this.requestSystems.tooltip ='Requesting compilation systems...'
            this.requestSystems.show()
            this.requestedSystems = true
            const uri = this.editor.document.uri.toString()
            // Check if language client was already initialized and wait till it is
            this.lsClient.onReady().then(async () => {
                await this.lsClient.sendNotification(GET_SYSTEMS, uri)
            })
        } else {
            this.systems = []
        }
    }

    /**
     *
     * @param id id of snapshot e.g. Signal
     * @param index index of snapshot
     */
    public show(uri: string, index: number): void {
        this.lsClient.onReady().then(async () => {
            this.indexMap.set(uri, index)
            this.lsClient.sendRequest(SHOW, [uri, diagramType + '_sprotty', index])
            // original model must not fire this emitter.
            if (index !== -1) {
                this.showedNewSnapshotEmitter.fire("Success")
            }
            return true
        })
    }

    /**
     * Invoke compilation and update status in widget
     * @param command compilation system
     * @param inplace whether inplace compilation is on or off
     * @param showResultingModel whether the resulting model should be shown in the diagram. Simulation does not do this.
     */
    public async compile(command: string, inplace: boolean, showResultingModel: boolean, snapshot: boolean): Promise<void> {
        this.startTime = Date.now()
        this.compiling = true
        await this.executeCompile(command, inplace, showResultingModel, snapshot)
        this.lastInvokedCompilation = command
        this.lastCompiledUri = this.sourceModelPath
    }

    executeCompile(command: string, inplace: boolean, showResultingModel: boolean, snapshot: boolean): void {
        if (!this.editor) {
            vscode.window.showErrorMessage(EDITOR_UNDEFINED_MESSAGE)
            return;
        }

        const uri = this.sourceModelPath

        if (!this.autoCompile) {
            // TODO too much information? Test this for visual clutter
            vscode.window.showInformationMessage("Compiling " + uri + " with " + command)
        }
        this.lsClient.onReady().then(() => {
            this.lsClient.sendNotification(COMPILE, [uri, diagramType + '_sprotty', command, inplace, showResultingModel, snapshot])
            this.compilationStartedEmitter.fire(this)
        })

    }

    /**
     * Handles the visualization of new snapshot descriptions send by the LS.
     */
    handleNewSnapshotDescriptions(snapshotsDescriptions: CodeContainer, uri: string, finished: boolean, currentIndex: number, maxIndex: number): void {
        // Show next/previous command and keybinding if not already added
        if (!vscode.commands.getCommands().then(commands => {
            return commands.includes(SHOW_NEXT.command)
        })) {
            this.registerShowNext()
            this.registerShowPrevious()
        }
        this.isCompiled.set(uri as string, true)
        this.resultMap.set(uri as string, snapshotsDescriptions)
        this.snapshots = snapshotsDescriptions
        const length = snapshotsDescriptions.files.reduce((previousSum, snapshots) => {
            return previousSum + snapshots.length
        }, 0)
        this.lengthMap.set(uri as string, length)
        this.indexMap.set(uri as string, length - 1)
        if (finished) {
            let index = 0;
            let errorOccurred = false
            this.compiling = false
            let errorString = '';
            snapshotsDescriptions.files.forEach(array => {
                array.forEach(element => {
                    if (element.infos && element.infos.length > 0) {
                        element.iconPath = new vscode.ThemeIcon('info');
                        this.output.appendLine("[INFO]" + element.infos.reduce((x, y) => x + '\n' + y))
                    }
                    if (element.warnings && element.warnings.length > 0) {
                        element.iconPath = new vscode.ThemeIcon('warning');
                        this.output.appendLine("[WARN]" + element.warnings.reduce((x, y) => x + '\n' + y))
                    }
                    if (element.errors && element.errors.length > 0) {
                        element.iconPath = new vscode.ThemeIcon('error');
                        errorString = element.errors.reduce((x, y) => x + '\n' + y)
                        errorOccurred = true
                        this.output.appendLine("[ERROR]" + errorString)
                    }
                    element.index = index
                    index++
                    element.command = {
                        title: 'Show snapshot ' + element.label + " " + element.snapshotIndex,
                        command: SHOW_COMMAND.command,
                        arguments: [element]
                    }
                    this._onDidChangeTreeData.fire(element)
                })
            });
            this.compilationFinishedEmitter.fire(!errorOccurred)

            this.endTime = Date.now()
            // Set finished bar if the currentIndex of the processor is the maxIndex the compilation was not canceled TODO
            this.compilation.text = currentIndex === maxIndex && !errorOccurred ?
                    `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms)` :
                    `$(times) (${(this.endTime - this.startTime).toPrecision(3)}ms)`
            this.compilation.tooltip = currentIndex === maxIndex ? 'Compilation finished' : 'Compilation stopped'
            if (errorOccurred) {
                vscode.window.showErrorMessage('An error occurred during compilation. Check the output channel for details.' + errorString)
            }
        } else {
            // Set progress bar for compilation TODO
            const progress = '█'.repeat(currentIndex) + '░'.repeat(maxIndex - currentIndex)

            this.compilation.show()
            this.compilation.text =  `$(spinner) ${progress}`
            this.compilation.tooltip = 'Compiling...'
        }
        // this.compilerWidget.update() TODO it updates since the compilation data of this provider changes somehow
        this._onDidChangeTreeData.fire()
    }

    /**
     * Notifies the LS to cancel the compilation.
     */
    public async requestCancelCompilation(): Promise<void> {
        this.lsClient.onReady().then(() => {
            this.cancellingCompilation = true
            this.lsClient.sendNotification(CANCEL_COMPILATION)
            this.compilationFinishedEmitter.fire(false)
            // TODO somehow update view
        })
    }

    /**
     * Notification from LS that the compilation was cancelled.
     * @param success wether cancelling the compilation was successful
     */
    public async cancelCompilation(success: boolean): Promise<void> {
        this.cancellingCompilation = false
        if (success) {
            this.compiling = false
        }
    }

    // /**
    //  * Sends request to LS to get text to open new code editor with
    //  */
    // async displayInputModel(action: PerformActionAction): Promise<void> {
    //     this.lsClient.onReady().then(async () => {
    //         const codeContainer: Code = await this.lsClient.sendRequest('keith/kicool/get-code-of-model', [action.kGraphElementId, diagramType + '_sprotty'])
    //         const uri = new URI(this.workspace.rootUri + '/KIELER_DEV/' + codeContainer.fileName)
    //         this.fileSystem.delete(uri.toString())
    //         this.fileSystem.createFolder(this.workspace.rootUri + '/KIELER_DEV')
    //         this.getDirectory(uri).then(parent => {
    //             if (parent) {
    //                 const parentUri = new URI(parent.uri);
    //                 const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parentUri, parent, uri.path.name, uri.path.ext);

    //                 if (vacantChildUri.toString()) {
    //                     const fileUri = parentUri.resolve(vacantChildUri.displayName);
    //                     this.fileSystem.createFile(fileUri.toString()).then(() => {
    //                         open(this.openerService, fileUri, {
    //                             mode: 'reveal',
    //                             widgetOptions: {
    //                                 ref: this.editorManager.currentEditor
    //                             }
    //                         }).then(() => {
    //                             this.editorManager.getByUri(fileUri).then(editor => {
    //                                 if (editor) {
    //                                     editor.editor.replaceText({
    //                                         source: fileUri.toString(),
    //                                         replaceOperations: [{range: {
    //                                             start: { line: 0, character: 0 },
    //                                             end: {
    //                                                 line: editor.editor.document.lineCount,
    //                                                 character: editor.editor.document.getLineContent(editor.editor.document.lineCount).length
    //                                             }
    //                                         }, text: codeContainer.code}]
    //                                     })
    //                                     editor.editor.document.save()
    //                                 }
    //                             })

    //                         })
    //                     })
    //                 }
    //             }
    //         })
    //     })        
    // }

    // TODO
    registerShowNext(): void {
        vscode.commands.registerCommand(SHOW_NEXT.command, () => {
            if (!this.editor) {
                // this.messageService.error(EDITOR_UNDEFINED_MESSAGE)
                return false
            }
            const uri = this.sourceModelPath
            if (!this.isCompiled.get(uri)) {
                // this.messageService.error(uri + " was not compiled")
                return false
            }
            const lastIndex = this.indexMap.get(uri)
            if (lastIndex !== 0 && !lastIndex) {
                // this.messageService.error("Index is undefined")
                return false
            }
            const length = this.lengthMap.get(uri)
            if (length !== 0 && !length) {
                // this.messageService.error("Length is undefined")
                return false
            }
            if (lastIndex === length - 1) { // No show necessary, since the last snapshot is already drawn.
                return false
            }
            return this.show(uri, Math.min(lastIndex + 1, length - 1))
        }
        )
        // TODO
        // this.keybindingRegistry.registerKeybinding({
        //     command: SHOW_NEXT.id,
        //     context: this.kicoolKeybindingContext.id,
        //     keybinding: SHOW_NEXT_KEYBINDING
        // })
    }

    registerShowPrevious(): void {
        vscode.commands.registerCommand(SHOW_PREVIOUS.command, () => {
            if (!this.editor) {
                // this.messageService.error(EDITOR_UNDEFINED_MESSAGE)
                return false
            }
            const uri = this.sourceModelPath
            if (!this.isCompiled.get(uri)) {
                // this.messageService.error(uri + ' was not compiled')
                return false
            }
            const lastIndex = this.indexMap.get(uri)
            if (lastIndex !== 0 && !lastIndex) {
                // this.messageService.error('Index is undefined')
                return false
            }
            if (lastIndex === -1) { // No show necessary, since the original model is already drawn.
                return true
            }
            // Show for original model is on the lower bound of -1.
            return this.show(uri, Math.max(lastIndex - 1, -1))
        }
        )
        // this.keybindingRegistry.registerKeybinding({
        //     command: SHOW_PREVIOUS.id,
        //     context: this.kicoolKeybindingContext.id,
        //     keybinding: SHOW_PREVIOUS_KEYBINDING
        // })
    }

    // private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>()
    // readonly onDidChangeTreeData = this._onDidChangeTreeData.event
    private _onDidChangeTreeData: vscode.EventEmitter<CompilationData | undefined | null | void> = new vscode.EventEmitter<CompilationData | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CompilationData | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: CompilationData): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element) {
            // Put context into element to show it in diagram
            element.id = element.name + element.index + (!element.contextValue || element.contextValue != "parent"? ":" + element.snapshotIndex : "")
            element.label = element.name
            return element
        }
        // resultMap holds a CodeContainer with everything
        throw new Error('Method not implemented.');
    }
    getChildren(element?: CompilationData): vscode.ProviderResult<CompilationData[]> {
        // TODO somehow show the original model in there too
        if (this.snapshots) {
            if (element?.contextValue == 'parent') {
                let index = -1;
                this.snapshots?.files.find(e => {
                    index++;
                    return e[0].index === element.index
                })
                return this.snapshots.files[index]
            } else {
                const originalElement = new CompilationData(
                    'Original',
                    '',
                    vscode.TreeItemCollapsibleState.None,
                    'Original', 0,
                    -1, [], [], [])
                originalElement.command =  {
                    title: 'Show original ',
                    command: SHOW_COMMAND.command,
                    arguments: [originalElement]
                }
                return [originalElement].concat(this.snapshots.files.map(snapshots => {
                    if (snapshots.length > 1) {
                        // TODO calculate or safe what was expanded and what collapsed for each compilation systems, maybe by their name?
                        const parentElement = new CompilationData(snapshots[0].name, '', vscode.TreeItemCollapsibleState.Collapsed, snapshots[0].name, snapshots[0].snapshotIndex,
                        snapshots[0].index)
                        parentElement.contextValue = 'parent'
                        return parentElement
                    }
                    snapshots[0].contextValue = 'snapshot'
                    return snapshots[0]
                }))
            }
        }
        return []
    }
}

export class CompilationData extends vscode.TreeItem {
    constructor(
        public label: string,
        private version: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        name: string,
        snapshotIndex: number,
        index: number,
        errors?: string[],
        warnings?: string[],
        infos?: string[]
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
        this.name = name
        this.snapshotIndex = snapshotIndex
        this.index = index
        if (errors) {
            this.errors = errors;
        }
        if (warnings) {
            this.warnings = warnings;
        }
        if (infos) {
            this.infos = infos;
        }
    }
    name: string;
    snapshotIndex: number;
    index: number;
    errors?: string[];
    warnings?: string[];
    infos?: string[];
}

export class CompilationSystem {
    constructor(
        label: string,
        id: string,
        isPublic: boolean,
        simulation: boolean,
        snapshotSystem: boolean
    ) {
        this.label = label
        this.id = id
        this.isPublic = isPublic
        this.simulation = simulation
        this.snapshotSystem = snapshotSystem
    }
    label: string
    id: string
    isPublic: boolean
    simulation: boolean
    snapshotSystem: boolean
}

/**
 * Equivalent to CodeContainer send by LS
 */
export interface CodeContainer {
    files: CompilationData[][]
}

export interface Code {
    fileName: string
    code: string
}

// /**
//  * (name, snapshotId) should be unique. GroupId for bundling in phases
//  */
// export class Snapshot {
//     name: string;
//     snapshotIndex: number;
//     errors?: string[];
//     warnings?: string[];
//     infos?: string[];
//     constructor(name: string, snapshotIndex: number) {
//         this.name = name
//         this.snapshotIndex = snapshotIndex
//     }
// }