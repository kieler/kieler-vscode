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
import { Settings, SimulationType } from '../constants';
import { CompilationDataProvider, CompilationSystem, CompilationSystemsMessage } from '../kico/compilation-data-provider';
import { PerformActionAction } from '../perform-action-handler';
import { SettingsService } from '../settings';
import { Tuple } from '../util';
import {
    ADD_CO_SIMULATION,
    COMPILE_AND_SIMULATE,
    COMPILE_AND_SIMULATE_SNAPSHOT,
    LOAD_TRACE, NEW_VALUE_SIMULATION,
    OPEN_EXTERNAL_KVIZ_VIEW,
    PAUSE_SIMULATION,
    RUN_SIMULATION,
    SAVE_TRACE,
    SET_SIMULATION_STEP_DELAY,
    SET_SIMULATION_TYPE_TO,
    SHOW_INTERNAL_VARIABLES,
    SIMULATE,
    STEP_SIMULATION,
    STOP_SIMULATION
} from './commands';
import { delay, LoadedTraceMessage, SavedTraceMessage, SimulationDataBlackList, SimulationStartedMessage, SimulationStepMessage, SimulationStoppedMessage, strMapToObj, Trace } from './helper';

export const externalStepMessageType = 'keith/simulation/didStep'
export const valuesForNextStepMessageType = 'keith/simulation/valuesForNextStep'
export const externalStopMessageType = 'keith/simulation/externalStop'
export const startedSimulationMessageType = 'keith/simulation/started'

export class SimulationTableDataProvider implements vscode.WebviewViewProvider {
    public readonly newSimulationDataEmitter = new vscode.EventEmitter<this>()

    public readonly newSimulationData: vscode.Event<this> = this.newSimulationDataEmitter.event

    protected readonly onRequestSimulationSystemsEmitter = new vscode.EventEmitter<this | undefined>()

    readonly onDidChangeOpenStateEmitter = new vscode.EventEmitter<boolean>()

    output: vscode.OutputChannel

    /**
     * Trace for each symbol.
     */
    public simulationData: Map<string, SimulationData> = new Map()
    /**
     * Trace for each symbol.
     */
    // public simulationTreeData: SimulationTreeData[] = [new SimulationTreeData("test", "test", vscode.TreeItemCollapsibleState.None, [true, true, false], true, true, ["fun", "with", "flags"])]

    /**
     * Holds the value that is set in the next tick. Holds only the inputs of the simulation
     */
    public valuesForNextStep: Map<string, any> = new Map()

    /**
     * Indicates whether an input value should be sent to the server.
     */
    public changedValuesForNextStep: Map<string, any> = new Map()

    /**
     * Map which holds wether a event listener is registered for a symbol
     */
    public eventListenerRegistered: Map<string, boolean> = new Map()

    /**
     * Wether next simulation step should be requested after a time specified by simulation delay
     */
    public play = false

    /**
     * Set by SimulationContribution after a simulation is started or stopped.
     * If false disables step, stop and play.
     */
    public controlsEnabled = false

    /**
     * Indicates whether a simulation is currently running.
     * TODO this might not be needed since simulationRunning already expresses this
     */
    simulationRunning = false

    /**
     * Categories of variables with their respective members.
     */
    public categories: string[] = []

    /**
     * The trace that is loaded for the current model.
     */
    public currentTrace: Trace

    public simulationStep = -1

    public compilingSimulation = false

    simulationCommands: vscode.Command[] = []

    startTime = 0

    endTime = 0

    public static readonly viewType = 'kieler-simulation-table'

    public kico: CompilationDataProvider

    private lsClient: LanguageClient

    private systems: CompilationSystem[] = []

    private snapshotSystems: CompilationSystem[] = []

    private simulationStatus: vscode.StatusBarItem

    protected table: TableWebview;

    protected disposables: vscode.Disposable[] = [];

    constructor(
        lsClient: LanguageClient,
        kico: CompilationDataProvider,
        readonly context: vscode.ExtensionContext,
        private readonly settings: SettingsService<Settings>
    ) {
        // Output channel
        this.output = vscode.window.createOutputChannel('KIELER Simulation')
        this.output.appendLine(`[INFO]\t${'Simulation view is created'}`)

        this.lsClient = lsClient
        this.kico = kico
        this.simulationStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        this.context.subscriptions.push(this.simulationStatus)

        // Push context variables for conditional menu items
        vscode.commands.executeCommand('setContext', 'keith.vscode:simulationRunning', this.simulationRunning)
        vscode.commands.executeCommand('setContext', 'keith.vscode:play', this.play)

        // Bind to events
        this.disposables.push(kico.newSimulationCommands((systems) => {
            if (typeof systems !== 'undefined') {
                this.registerSimulationCommands(systems)
            }
            // Else case is that important enough to alert the user
        }))
        this.disposables.push(kico.compilationStarted(() => {
            this.compilationStarted()
        }))
        this.disposables.push(kico.compilationFinished((success) => {
            if (typeof success !== 'undefined') {
                this.compilationFinished(success)
            }
            // Else case is that important enough to alert the user
        }))
        this.disposables.push(kico.compilationFinished((successful) => {
            if (successful !== undefined) {
                this.compilationFinished(successful)
            }
        }))

        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(externalStepMessageType, (message: SimulationStepMessage) => {
                this.handleStepMessage(message)
            })
            lsClient.onNotification(valuesForNextStepMessageType, (message: SimulationStepMessage) => {
                this.handleExternalNewUserValue(message)
            })
            lsClient.onNotification(externalStopMessageType, (message: string) => {
                this.handleExternalStop(message)
            })
            lsClient.onNotification(startedSimulationMessageType, (message: SimulationStartedMessage) => {
                this.handleSimulationStarted(message)
            })
        })

        // Create commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand(SIMULATE.command, async () => {
                this.simulate()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(STOP_SIMULATION.command, async () => {
                this.stopSimulation()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(STEP_SIMULATION.command, async () => {
                this.executeSimulationStep()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(PAUSE_SIMULATION.command, async () => {
                this.startOrPauseSimulation()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_SIMULATION.command, async () => {
                this.startOrPauseSimulation()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(SAVE_TRACE.command, async () => {
                this.saveTrace()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(LOAD_TRACE.command, async () => {
                this.loadTrace()
            })
        )

        // Simulation quickpick commands

        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_AND_SIMULATE.command, async () => {
                const options = this.createQuickPick(this.systems)
                const quickPick = vscode.window.createQuickPick()
                quickPick.items = options
                quickPick.onDidChangeSelection((selection) => {
                    if (selection[0]) {
                        this.systems.forEach((system) => {
                            if (system.label === selection[0].label) {
                                kico.compile(system.id, true, false, system.snapshotSystem)
                                this.compilingSimulation = true
                            }
                        })
                    }
                    quickPick.hide()
                })
                quickPick.onDidHide(() => quickPick.dispose())
                quickPick.show()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_AND_SIMULATE_SNAPSHOT.command, async () => {
                const options = this.createQuickPick(this.snapshotSystems)
                const quickPick = vscode.window.createQuickPick()
                quickPick.items = options
                quickPick.onDidChangeSelection((selection) => {
                    if (selection[0]) {
                        this.snapshotSystems.forEach((system) => {
                            if (system.label === selection[0].label) {
                                kico.compile(system.id, true, false, system.snapshotSystem)
                            }
                        })
                    }
                    quickPick.hide()
                })
                quickPick.onDidHide(() => quickPick.dispose())
                quickPick.show()
            })
        )

        // Kviz commands

        this.context.subscriptions.push(
            vscode.commands.registerCommand(OPEN_EXTERNAL_KVIZ_VIEW.command, this.openExternalKVizView, this)
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(ADD_CO_SIMULATION.command, this.handleAddCoSimulation, this)
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(NEW_VALUE_SIMULATION.command, this.newInputValue, this)
        )

        // settings commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand(SET_SIMULATION_STEP_DELAY.command, async () => {
                const input = await vscode.window.showInputBox({
                    // eslint-disable-next-line no-restricted-globals
                    validateInput: (val) => (isNaN(parseInt(val, 10)) ? 'Given input is not a valid number!' : null),
                })
                if (input !== undefined) {
                    const simulationSetDelay = parseInt(input, 10)
                    this.settings.set('simulationStepDelay', simulationSetDelay)
                }
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(SET_SIMULATION_TYPE_TO.command, () => {
                const simulationTypes: Tuple<SimulationType> = ['Manual', 'Periodic', 'Dynamic']
                const options: vscode.QuickPickItem[] = simulationTypes.map((type) => ({
                    label: type,
                    picked: this.settings.get('simulationType') === type,
                }))
                const quickPick = vscode.window.createQuickPick()
                quickPick.items = options
                quickPick.onDidChangeSelection((selection) => {
                    if (selection[0]) {
                        this.settings.set('simulationType', selection[0].label as SimulationType)
                    }
                    quickPick.hide()
                })
                quickPick.onDidHide(quickPick.dispose)
                quickPick.show()
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(SHOW_INTERNAL_VARIABLES.command, () => {
                const options: vscode.QuickPickItem[] = [
                    {
                        label: 'true',
                        picked: this.settings.get('showInternalVariables.enabled'),
                    },
                    {
                        label: 'false',
                        picked: !this.settings.get('showInternalVariables.enabled'),
                    },
                ]
                const quickPick = vscode.window.createQuickPick()
                quickPick.items = options
                quickPick.onDidChangeSelection((selection) => {
                    if (selection[0]) {
                        this.settings.set('showInternalVariables.enabled', selection[0]?.label === 'true')
                        this.initializeTable()
                    }
                    quickPick.hide()
                })
                quickPick.onDidHide(quickPick.dispose)
                quickPick.show()
            })
        )
        
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        const tWebview = new TableWebview(
            "KIELER Simulation",
            [
                this.getExtensionFileUri('dist')
            ],
            this.getExtensionFileUri('dist', 'simulation-webview.js'),
        );
        tWebview.webview = webviewView.webview;
        tWebview.webview.options = {
            enableScripts: true
        };
        const title = tWebview.createTitle();
        webviewView.title = title;
        tWebview.initializeWebview(webviewView.webview, title, ['Name', 'Input', 'History', 'Categories']);
        this.table = tWebview;
        this.context.subscriptions.push(
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
        const data = this.simulationData.get(rowId)
        if (data && data.input) {
            this.newInputValue(data)
        }
    }

    dispose() {
        this.disposables.forEach(d => d.dispose())
        this.table.dispose()
    }

    createQuickPick(systems: CompilationSystem[]): vscode.QuickPickItem[] {
        const quickPicks: vscode.QuickPickItem[] = []
        systems.forEach((system) => {
            quickPicks.push({
                label: system.label,
            })
        })
        return quickPicks
    }

    // SIMULATION

    /**
     * Registers send systems as simulation systems in the command palette
     * @param systems systems that are assumed to be simulation systems
     */
    registerSimulationCommands(systemsMessage: CompilationSystemsMessage): void {
        this.systems = []
        this.snapshotSystems = []
        systemsMessage.systems.forEach((system) => {
            this.systems.push(system)
        })
        systemsMessage.snapshotSystems.forEach((system) => {
            this.snapshotSystems.push(system)
        })
        this.simulationStatus.hide()
    }

    /**
     * Called after a compilation process was started
     */
    compilationStarted(): void {
        // this.update()
    }

    /**
     * Called after compilation finished.
     */
    compilationFinished(successful: boolean): void {
        if (this.compilingSimulation) {
            // If a simulation systems is currently compiling one has to simulate it afterwards
            this.compilingSimulation = false
            // this.update()
            if (successful) {
                vscode.commands.executeCommand(SIMULATE.command)
            }
        } else {
            // this.update()
        }
    }

    async handleAddCoSimulation(action: PerformActionAction): Promise<void> {
        // TODO Uri of simulation file
        const executableUri = await vscode.window.showOpenDialog({
            title: 'Select CoSimulation executable',
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
        })
        if (executableUri) {
            const lClient = await this.lsClient
            lClient.sendNotification('keith/simulation/addCoSimulation', [
                'keith-diagram_sprotty',
                executableUri[0].path.toString(),
            ])
        }
    }

    async newInputValue(simulationData: SimulationData): Promise<void> {
        const result = await vscode.window.showInputBox({
            value: JSON.stringify(this.valuesForNextStep.get(simulationData.id)),
            placeHolder: `Input value for ${simulationData.id}`,
            title: `New value for ${simulationData.id}`,
            validateInput: (text) => {
                let valid = false
                if (!text) {
                    return ''
                }
                try {
                    valid =
                        simulationData.data.length === 0 ||
                        typeof JSON.parse(text) === typeof simulationData.data[simulationData.data.length - 1]
                } catch (e) {
                    // We do not care but we also do not set valid
                }
                return valid ? '' : `Input is not type of ${typeof simulationData.data[simulationData.data.length - 1]}`
            },
        })
        if (result) {
            const parsedResult = JSON.parse(result)
            this.valuesForNextStep.set(simulationData.id, parsedResult)
            this.changedValuesForNextStep.set(simulationData.id, parsedResult)
            this.table.updateCell(simulationData.id, 'Input', JSON.stringify(parsedResult))
        }
    }

    /**
     * Invoke simulation.
     * To be successful a compilation with a simulation compilation system has to be invoked before this function call.
     */
    async simulate(): Promise<void> {
        // A simulation can only be invoked if a current editor widget exists and no simulation is currently running.
        if (this.kico.editor && !this.simulationRunning) {
            // The uri of the current editor is needed to identify the already compiled snapshot that is used to start the simulation.
            const uri = this.kico.lastCompiledUri
            this.lsClient.onReady().then(() => {
                this.lsClient.sendNotification('keith/simulation/start', [uri, this.settings.get('simulationType')])
            })
            this.simulationStatus.text = '$(spinner) Starting simulation...'
            this.simulationStatus.tooltip = 'Starting simulation...'
            this.simulationStatus.show()
        } else {
            this.simulationStatus.text = `$(times) ${
                this.kico.editor ? 'Simulation already running' : 'No editor defined'
            }`
            this.simulationStatus.tooltip = 'Did not simulate.'
            this.simulationStatus.show()
        }
    }

    /**
     * Start simulation after server successfully started it.
     */
    async handleSimulationStarted(startMessage: SimulationStartedMessage): Promise<void> {
        this.endTime = Date.now()
        if (!startMessage.successful) {
            this.startTime = Date.now()
            this.simulationStatus.text = `$(cross) (${(this.endTime - this.startTime).toPrecision(
                3
            )}ms) Simulation could not be started`
            this.simulationStatus.tooltip = 'Did not simulate.'
            this.simulationStatus.show()
            this.output.appendLine(`[ERROR]\t${startMessage.error}`)
            return
        }
        this.simulationStatus.text = `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulating...`
        this.simulationStatus.tooltip = ''
        this.simulationStatus.show()

        // Get the start configuration for the simulation
        const pool: Map<string, any> = new Map(Object.entries(startMessage.dataPool))
        const propertySet: Map<string, any> = new Map(Object.entries(startMessage.propertySet))
        // Inputs and outputs are handled separately
        let inputs: string[] = propertySet.get('input')
        inputs = inputs === undefined ? [] : inputs
        let outputs: string[] = propertySet.get('output')
        outputs = outputs === undefined ? [] : outputs
        // Construct list of all categories
        this.categories = Array.from(propertySet.keys())
        pool.forEach((value, key) => {
            // Add list of properties to SimulationData
            const categoriesList: string[] = []
            propertySet.forEach((list, propertyKey) => {
                if (list.includes(key)) {
                    categoriesList.push(propertyKey)
                }
            })
            const newData: SimulationData = {
                id: key,
                label: key,
                data: [],
                input: inputs.includes(key),
                output: outputs.includes(key),
                categories: categoriesList,
            }
            this.simulationData.set(key, newData)
            // Set the value for which will be set for the next step for inputs
            if (inputs.includes(key)) {
                this.valuesForNextStep.set(key, value)
            }
        })
        this.controlsEnabled = true
        this.initializeTable()
        this.simulationRunning = true
        vscode.commands.executeCommand('setContext', 'keith.vscode:simulationRunning', this.simulationRunning)
        this.simulationStep = 0
        // Show simulation view
        this.update()
    }

    /**
     * Executes a simulation step on the LS.
     */
    async executeSimulationStep(): Promise<void> {
        const lClient = await this.lsClient
        // Transform the input map to an object since this is the format the LS supports
        const jsonObject = strMapToObj(this.changedValuesForNextStep)
        lClient.sendNotification('keith/simulation/step', [jsonObject, 'Manual'])
        this.update()
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation(): Promise<void> {
        this.setValuesToStopSimulation()
        this.simulationStatus.text = '$(spinner) Stopping simulation...'
        this.simulationStatus.tooltip = 'Request to stop the simulation is about to be send'
        this.simulationStatus.show()
        const lClient = await this.lsClient
        const message: SimulationStoppedMessage = (await lClient.sendRequest(
            'keith/simulation/stop'
        )) as SimulationStoppedMessage
        if (!message.successful) {
            this.output.appendLine(`[ERROR]\t${message.message}`)
        }
        this.update()
        this.simulationStatus.text = 'Stopped simulation'
        this.simulationStatus.tooltip = ''
        this.simulationStatus.show()
    }

    private setValuesToStopSimulation(): void {
        // Stop all simulation, i.e. empty maps and kill simulation process on LS
        this.valuesForNextStep.clear()
        this.simulationData.clear()
        // this.simulationTreeData = []
        this.play = false
        vscode.commands.executeCommand('setContext', 'keith.vscode:play', this.play)
        this.controlsEnabled = false
        this.simulationRunning = false
        vscode.commands.executeCommand('setContext', 'keith.vscode:simulationRunning', this.simulationRunning)
    }

    /**
     * Toggles play.
     * Begins to execute steps while waiting simulationWidget.simulationDelay between each step.
     */
    async startOrPauseSimulation(): Promise<void> {
        this.play = !this.play
        vscode.commands.executeCommand('setContext', 'keith.vscode:play', this.play)
        // this.update()
        if (this.play) {
            await this.waitForNextStep()
        }
    }

    /**
     * Asks the user for a file to store the simulation trace from the current simulation in a file.
     */
    async saveTrace(): Promise<void> {
        // Ask the user where to save this trace
        const currentFolder = vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined
        const uri = await vscode.window.showSaveDialog({
            filters: { KTrace: ['ktrace'] },
            title: 'Save current KTrace to...',
            defaultUri: currentFolder ? vscode.Uri.file(`${currentFolder}/trace.ktrace`) : undefined,
        })
        if (uri === undefined) {
            // The user did not pick any file to save to.
            return
        }

        // Request the LS to save the current trace into the file picked by the user.
        const lsClient = await this.lsClient
        const message = (await lsClient.sendRequest('keith/simulation/saveTrace', uri.path)) as SavedTraceMessage
        if (!message.successful) {
            const errorMessage = `could not save trace: ${message.reason}`
            this.output.appendLine(`[ERROR]\t${errorMessage}`)
            vscode.window.showErrorMessage(errorMessage)
        }
    }

    /**
     * Asks the user for a file to load simulation trace from and loads that onto the client and server.
     */
    async loadTrace(): Promise<void> {
        // Loading the trace file.
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { KTrace: ['ktrace'] },
        })
        if (uris === undefined) {
            // The user did not pick any file to load.
            return
        }
        this.loadTraceFromUri(uris[0])
    }

    async loadTraceFromUri(uri: vscode.Uri): Promise<void> {
        // Send the trace file uri to the server to convert it into a Trace model and to load it.
        const lClient = await this.lsClient
        const message = (await lClient.sendRequest('keith/simulation/loadTrace', uri.path)) as LoadedTraceMessage

        if (!message.successful) {
            const errorMessage = `could not load trace: ${message.reason}`
            this.output.appendLine(`[ERROR]\t${errorMessage}`)
            vscode.window.showErrorMessage(errorMessage)
            return
        }
        // Store the trace model here as well.
        this.currentTrace = message.trace
    }

    /**
     * Execute a simulation step with a delay.
     */
    async waitForNextStep(): Promise<void> {
        while (this.play) {
            this.executeSimulationStep()
            // eslint-disable-next-line no-await-in-loop
            await delay(this.settings.get('simulationStepDelay'))
        }
    }

    /**
     * Is executed after the server finishes a step.
     * @param message data of step, includes new values.
     */
    handleStepMessage(message: SimulationStepMessage): boolean {
        const pool: Map<string, any> = new Map(Object.entries(message.values))
        if (pool) {
            pool.forEach((value, key) => {
                // push value in history and set new input value
                const history = this.simulationData.get(key)
                if (history !== undefined) {
                    // Push value in history
                    history.data.push(value)
                    this.simulationData.set(key, history)
                    // The simulation may change. for example input output values
                    if (history.input) {
                        this.valuesForNextStep.set(key, value)
                    }
                } else {
                    // This should not happen. An unexpected value was send by the server.
                    this.stopSimulation()
                    this.output.appendLine('[ERROR]\tUnexpected value for " + key + "in simulation data, stopping simulation.')
                }
            })
        } else {
            this.output.appendLine('[ERROR]\tSimulation data values are undefined.')
        }
        if (!this.simulationRunning) {
            return false
        }
        this.simulationStep++
        this.changedValuesForNextStep.clear()
        this.update()
        return true
    }

    handleExternalNewUserValue(values: unknown): void {
        console.log('external value', values)
        // this.messageService.warn('External new user values are not implemented')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleExternalStop(message: string): void {
        this.output.appendLine('[ERROR]\tStopped simulation because of exception on LS. You might want to reload the window.')
        // this.messageService.error(message)
        this.setValuesToStopSimulation()
    }

    /**
     * Start the simulation visualization socket server and opens a browser window.
     */
    openExternalKVizView(): void {
        this.lsClient.onReady().then(() => {
            this.lsClient.sendNotification('keith/simulation/startVisualizationServer')
        })
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:5010/visualization'))
    }

    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this.context.extensionPath, ...segments))
    }

    initializeTable() {
        // Initialize table
        this.table.reset()
        this.simulationData.forEach(entry => {
            if (!(
                SimulationDataBlackList.includes(entry.id) ||
                entry.id.includes('_tickCounter') ||
                entry.id.startsWith('_') ||
                entry.id.startsWith('#')
            ) || this.settings.get('showInternalVariables.enabled') && !SimulationDataBlackList.includes(entry.id)) {
                this.table.addRow(entry.id, entry.label, entry.input? JSON.stringify(this.valuesForNextStep.get(entry.id)) : '', entry.data.toString(), entry.categories.toString())
            }
        })
    }

    update(): void {
        if (this.simulationRunning) {
            this.simulationData.forEach(entry => {
                if (!(
                    SimulationDataBlackList.includes(entry.id) ||
                    entry.id.includes('_tickCounter') ||
                    entry.id.startsWith('_') ||
                    entry.id.startsWith('#')
                ) || this.settings.get('showInternalVariables.enabled') && !SimulationDataBlackList.includes(entry.id)) {
                    this.table.updateCell(entry.id, 'History', entry.data.reverse().toString())
                }
            })
        }
    }
}

export class SimulationData {
    constructor(
        public label: string,
        public id: string,
        public data: any[],
        public input: boolean,
        public output: boolean,
        public categories: string[]
    ) {
    }
}