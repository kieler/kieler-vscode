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
import * as path from 'path';
import { LanguageClient } from 'vscode-languageclient';
import { CompilationDataProvider, CompilationSystem } from '../kico/compilation-data-provider';
import { ADD_CO_SIMULATION, COMPILE_AND_SIMULATE, COMPILE_AND_SIMULATE_SNAPSHOT, LOAD_TRACE, NEW_VALUE_SIMULATION, OPEN_EXTERNAL_KVIZ_VIEW, OPEN_INTERNAL_KVIZ_VIEW, PAUSE_SIMULATION, RUN_SIMULATION, SAVE_TRACE, SIMULATE, STEP_SIMULATION, STOP_SIMULATION } from './commands';
import { delay, reverse, SimulationDataBlackList, LoadedTraceMessage, SavedTraceMessage, SimulationStartedMessage, SimulationStepMessage, SimulationStoppedMessage, strMapToObj, Trace } from './helper';
import { PerformActionAction } from '../perform-action-handler'
import { StorageService } from '../storage';

export const externalStepMessageType = 'keith/simulation/didStep';
export const valuesForNextStepMessageType = 'keith/simulation/valuesForNextStep';
export const externalStopMessageType = 'keith/simulation/externalStop';
export const startedSimulationMessageType = 'keith/simulation/started';

export class SimulationTreeDataProvider implements vscode.TreeDataProvider<SimulationTreeData> {


    public readonly newSimulationDataEmitter = new vscode.EventEmitter<this>()

    public readonly newSimulationData: vscode.Event<this> = this.newSimulationDataEmitter.event

    protected readonly onRequestSimulationSystemsEmitter = new vscode.EventEmitter<this | undefined>()

    readonly onDidChangeOpenStateEmitter = new vscode.EventEmitter<boolean>()

    /**
     * Trace for each symbol.
     */
    public simulationData: Map<string, SimulationTreeData> = new Map
    /**
     * Trace for each symbol.
     */
    // public simulationTreeData: SimulationTreeData[] = [new SimulationTreeData("test", "test", vscode.TreeItemCollapsibleState.None, [true, true, false], true, true, ["fun", "with", "flags"])]

    /**
     * Holds the value that is set in the next tick. Holds only the inputs of the simulation
     */
    public valuesForNextStep: Map<string, any> = new Map

    /**
     * Indicates whether an input value should be sent to the server.
     */
    public changedValuesForNextStep: Map<string, any> = new Map

    /**
     * Map which holds wether a event listener is registered for a symbol
     */
    public eventListenerRegistered: Map<string, boolean> = new Map

    /**
     * Whether the input/output column is added to the table.
     * this is part of the state of the widget.
     */
    protected displayInOut = false

    /**
     * Wether next simulation step should be requested after a time specified by simulation delay
     */
    public play = false

    /**
     * Time in milliseconds to wait till next simulation step is requested in play mode.
     */
    public simulationStepDelay: number;

    /**
     * All simulation types
     */
    public simulationTypes: string[] = ["Periodic", "Manual", "Dynamic"]

    /**
     * The currently selected simulation type.
     * The value of this attribute is simulation type selected by default.
     */
    public simulationType: string;

    /**
     * Set by SimulationContribution after a simulation is started or stopped.
     * If false disables step, stop and play.
     */
    public controlsEnabled = false

    /**
     * Indicates whether the input/output column should be displayed.
     */
    public inputOutputColumnEnabled = true

    /**
     * Indicates whether a simulation is currently running.
     * TODO this might not be needed since simulationRunning already expresses this
     */
    public simulationRunning = false

    /**
     * Show internal variables of simulation (e.g. guards, ...)
     */
    public showInternalVariables: boolean;

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

	public static readonly viewType = 'kieler-simulation-tree';

    public kico: CompilationDataProvider

    private lsClient: LanguageClient

    private systems: CompilationSystem[] = []

    private snapshotSystems: CompilationSystem[] = []

    private simulationStatus: vscode.StatusBarItem

    private _onDidChangeTreeData: vscode.EventEmitter<SimulationTreeData | undefined | null | void> = new vscode.EventEmitter<SimulationTreeData | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SimulationTreeData | undefined | null | void> = this._onDidChangeTreeData.event;


	constructor(lsClient: LanguageClient, kico: CompilationDataProvider, readonly context: vscode.ExtensionContext, private readonly storage: StorageService) {
        console.log('Simulation view tree is created')
        // TODO
        this.lsClient = lsClient
        this.kico = kico
        this.simulationStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
        // TODO this.simulationStatus.command = TODO reveal view on command
        this.context.subscriptions.push(this.simulationStatus)

        // Push context variables for conditional menu items
        vscode.commands.executeCommand('setContext', 'keith.vscode:simulationRunning', this.simulationRunning)
        vscode.commands.executeCommand('setContext', 'keith.vscode:play', this.play)

        // Load settings from storage
        this.simulationStepDelay = this.storage.get('keith.vscode.simulation.simulationStepDelay', 200)
        this.simulationType = this.storage.get('keith.vscode.simulation.simulationType', 'Periodic')
        this.showInternalVariables = this.storage.get('keith.vscode.simulation.showInternalVariables', false)

        // Bind to events
        kico.newSimulationCommands(systems => {
            if (typeof systems !== 'undefined') {
                this.registerSimulationCommands(systems)
            }
            // Else case is that important enough to alert the user
        })
        kico.compilationStarted(() => {
            this.compilationStarted()
        })
        kico.compilationFinished(success => {
            if (typeof success !== 'undefined') {
                this.compilationFinished(success)
            }
            // Else case is that important enough to alert the user
        })
        kico.compilationFinished.bind((successful: boolean) => {
            this.compilationFinished(successful)
        })

        // Bind to LSP messages
        lsClient.onReady().then(() => {
            lsClient.onNotification(externalStepMessageType, (message: SimulationStepMessage) => {
                this.handleStepMessage(message)
            });
            lsClient.onNotification(valuesForNextStepMessageType, (message: SimulationStepMessage) => {
                this.handleExternalNewUserValue(message)
            });
            lsClient.onNotification(externalStopMessageType, (message: string) => {
                this.handleExternalStop(message)
            });
            lsClient.onNotification(startedSimulationMessageType, (message: SimulationStartedMessage) => {
                this.handleSimulationStarted(message)
            });
        })

        // TODO Create commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand(SIMULATE.command, async () => {
                this.simulate()
            }));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(STOP_SIMULATION.command, async () => {
                this.stopSimulation()
            }));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(STEP_SIMULATION.command, async () => {
                this.executeSimulationStep()
            }));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(PAUSE_SIMULATION.command, async () => {
                this.startOrPauseSimulation()
            }));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(RUN_SIMULATION.command, async () => {
                this.startOrPauseSimulation()
            }));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(SAVE_TRACE.command, async () => {
                this.saveTrace()
            }));
    
        this.context.subscriptions.push(
            vscode.commands.registerCommand(LOAD_TRACE.command, async () => {
                this.loadTrace()
            }));


        // Simulation quickpick commands

        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_AND_SIMULATE.command, async () => {
                const options = this.createQuickPick(this.systems)
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = options;
                quickPick.onDidChangeSelection(selection => {
                    if (selection[0]) {
                        this.systems.forEach(system => {
                            if (system.label === selection[0].label) {
                                kico.compile(system.id, true, false, system.snapshotSystem)
                                this.compilingSimulation = true
                            }
                        })
                    }
                    quickPick.hide()
                });
                quickPick.onDidHide(() => quickPick.dispose());
                quickPick.show();
                
            }));
    
        this.context.subscriptions.push(
            vscode.commands.registerCommand(COMPILE_AND_SIMULATE_SNAPSHOT.command, async () => {
                const options = this.createQuickPick(this.snapshotSystems)
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = options;
                quickPick.onDidChangeSelection(selection => {
                    if (selection[0]) {
                        this.snapshotSystems.forEach(system => {
                            if (system.label === selection[0].label) {
                                kico.compile(system.id, true, false, system.snapshotSystem)
                            }
                        })
                    }
                    quickPick.hide()
                });
                quickPick.onDidHide(() => quickPick.dispose());
                quickPick.show();
                
            }));
        
        // Kviz commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand(OPEN_INTERNAL_KVIZ_VIEW.command, this.openInternalKVizView, this));

        this.context.subscriptions.push(
            vscode.commands.registerCommand(OPEN_EXTERNAL_KVIZ_VIEW.command, this.openExternalKVizView, this));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(ADD_CO_SIMULATION.command, this.handleAddCoSimulation, this));
        
        this.context.subscriptions.push(
            vscode.commands.registerCommand(NEW_VALUE_SIMULATION.command, this.newInputValue, this));
    }

    // BUILD VIEW

    getTreeItem(element: SimulationTreeData): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element.contextValue?.startsWith('simulation:data')) {
            element.label = element.id
            const newValue = this.valuesForNextStep.get(element.id)
            if (newValue) {
                element.description = JSON.stringify(newValue)
            } else {
                element.description = JSON.stringify(element.data[element.data.length - 1])
            }
            element.contextValue
            return element
        } else if (element.contextValue?.startsWith('simulation:history')) {
            return element
        }
        throw new Error('Tree item is not defined.');
    }

    getChildren(element?: SimulationTreeData): vscode.ProviderResult<SimulationTreeData[]> {
        if (this.simulationData) {
            if (element === undefined) {
                const result: SimulationTreeData[] = []
                this.simulationData.forEach((element: SimulationTreeData) => {

                    if (!(SimulationDataBlackList.includes(element.id) || element.id.includes('_tickCounter') || element.id.startsWith('_') || element.id.startsWith('#'))) {
                        element.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
                        element.contextValue = 'simulation:data' + (element.input? ':input' : '')
                        result.push(element)
                    }
                })
                return result
            } else if (element.contextValue?.startsWith('simulation:data')) {
                const history = new SimulationTreeData(
                    JSON.stringify(reverse(element.data)),
                    element.id + 'history',
                    vscode.TreeItemCollapsibleState.None,
                    element.data,
                    element.input,
                    element.output,
                    element.categories
                )
                history.contextValue = 'simulation:history' + (element.input? ':input' : '')
                if (history.input) {
                    history.command = {
                        title: NEW_VALUE_SIMULATION.title,
                        command: NEW_VALUE_SIMULATION.command,
                        arguments: [element]
                    }
                }
                return [history]
            }
            // No element other than the root element with its children is shown
        }
    }

    public update(): void {
        this._onDidChangeTreeData.fire(null)
        // TODO not necessary since TreeView automatically updates an change
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

    // SIMULATION

    /**
     * Registers send systems as simulation systems in the command palette
     * @param systems systems that are assumed to be simulation systems
     */
    registerSimulationCommands(systems: CompilationSystem[]): void {
        this.systems = []
        this.snapshotSystems = []
        systems.forEach(system => {
            if (system.snapshotSystem) {
                this.snapshotSystems.push(system)
            } else {
                this.systems.push(system)
            }
        });
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
        action
        // TODO Uri of simulation file
        const executableUri = await vscode.window.showOpenDialog({
            title: 'Select CoSimulation executable',
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false

        });
        if (executableUri) {
            const lClient = await this.lsClient
            lClient.sendNotification('keith/simulation/addCoSimulation', ['keith-diagram_sprotty',
                 executableUri[0].path.toString()])
        }
    }

    async newInputValue(simulationData: SimulationTreeData) : Promise<void> {
        const result = await vscode.window.showInputBox({
            value: JSON.stringify(simulationData.data[simulationData.data.length - 1]),
            placeHolder: 'Input value for ' + simulationData.id,
            title: 'New value for ' + simulationData.id,
            validateInput: (text => {
                let valid = false
                if (!text) {
                    return ''
                }
                try {
                    valid = (simulationData.data.length == 0) || typeof JSON.parse(text) === typeof simulationData.data[simulationData.data.length - 1]
                } catch (e) {
                    // We do not care but we also do not set valid
                }
                return valid ? '' : 'Input is not type of ' + typeof simulationData.data[simulationData.data.length - 1]
            })
        })
        if (result) {
            this.valuesForNextStep.set(simulationData.id, JSON.parse(result))
            this.changedValuesForNextStep.set(simulationData.id, JSON.parse(result))
            this.update()
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
                this.lsClient.sendNotification('keith/simulation/start', [uri, this.simulationType])
            })
            this.simulationStatus.text = '$(spinner) Starting simulation...',
            this.simulationStatus.tooltip ='Starting simulation...'
            this.simulationStatus.show()
            
        } else {
            this.simulationStatus.text = `$(times) ${this.kico.editor ? 'Simulation already running' : 'No editor defined'}`,
            this.simulationStatus.tooltip ='Did not simulate.'
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
            this.simulationStatus.text = `$(cross) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulation could not be started`,
            this.simulationStatus.tooltip ='Did not simulate.'
            this.simulationStatus.show()
            // TODO this.messageService.error(startMessage.error) TODO
            return
        } else {
            this.simulationStatus.text = `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulating...`,
            this.simulationStatus.tooltip =''
            this.simulationStatus.show()
        }

        // Get the start configuration for the simulation
        const pool: Map<string, any> = new Map(Object.entries(startMessage.dataPool));
        const propertySet: Map<string, any> = new Map(Object.entries(startMessage.propertySet));
        // Inputs and outputs are handled separately
        let inputs: string[] = propertySet.get('input')
        inputs = inputs === undefined ? [] : inputs
        let outputs: string[] = propertySet.get('output')
        outputs = outputs === undefined ? [] : outputs
        propertySet.delete('input')
        propertySet.delete('output')
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
            const newData: SimulationTreeData = {
                id: key,
                label: key + JSON.stringify([]),
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                data: [],
                input: inputs.includes(key),
                output: outputs.includes(key),
                categories: categoriesList}
            this.simulationData.set(key, newData)
            // this.simulationTreeData.push(newData)
            // Set the value for which will be set for the next step for inputs
            if (inputs.includes(key)) {
                this.valuesForNextStep.set(key, value)
            }
            this.controlsEnabled = true
            // Update view
        })
        this.simulationRunning = true
        vscode.commands.executeCommand('setContext', 'keith.vscode:simulationRunning', this.simulationRunning)
        this.simulationStep = 0
        // TODO show simulation view
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
        // TODO Update data to indicate that a step is in process
        this.update()
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation(): Promise<void> {
        this.setValuesToStopSimulation()
        this.simulationStatus.text = '$(spinner) Stopping simulation...',
        this.simulationStatus.tooltip = 'Request to stop the simulation is about to be send'
        this.simulationStatus.show()
        const lClient = await this.lsClient
        const message: SimulationStoppedMessage = await lClient.sendRequest('keith/simulation/stop') as SimulationStoppedMessage
        if (!message.successful) {
            // TODO this.messageService.error(message.message) TODO
        }
        this.update()
        this.simulationStatus.text = 'Stopped simulation',
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
        // Request the LS to serialize the current trace into a savable string.
        const lsClient = await this.lsClient
        const message = await lsClient.sendRequest('keith/simulation/saveTrace') as SavedTraceMessage
        if (!message.successful) {
            // TODO: better logging of error state
            console.log('could not save trace: ' + message.reason)
            return
        }
        
        // Ask the user where to save this trace
        const uri = await vscode.window.showSaveDialog({
            filters: {'KTrace': ['ktrace']},
            title: 'Save current KTrace to...',
        })
        if (uri === undefined) {
            // The user did not pick any file to save to.
            return
        }

        // Save the file on the file system.
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(message.fileContent))
    }

    /**
     * Asks the user for a file to load simulation trace from and loads that onto the client and server.
     */
    async loadTrace(): Promise<void> {
        // Loading the trace file.
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false, 
            filters: {'KTrace': ['ktrace']},
        })
        if (uris === undefined) {
            // The user did not pick any file to load.
            return
        }
        // If a document was selected, read its content from the workspace.
        const document = await vscode.workspace.openTextDocument(uris[0].path)
        const text = document.getText()

        // Send the trace file content to the server to convert it into a Trace model and to synchronize it.
        const lClient = await this.lsClient
        const message = await lClient.sendRequest('keith/simulation/loadTrace', text) as LoadedTraceMessage

        if (!message.successful) {
            // TODO: better logging of error state
            console.log('could not load trace: ' + message.reason)
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
            await delay(this.simulationStepDelay)
        }
    }

    /**
     * Is executed after the server finishes a step.
     * @param message data of step, includes new values.
     */
    handleStepMessage(message: SimulationStepMessage): boolean {
        const pool: Map<string, any> = new Map(Object.entries(message.values));
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
                    // TODO this.messageService.error("Unexpected value for " + key + "in simulation data, stopping simulation")
                }
            });
        } else {
            // TODO this.messageService.error('Simulation data values are undefined') TODO
        }
        if (!this.simulationRunning) {
            return false
        }
        this.simulationStep++
        this.changedValuesForNextStep.clear()
        this.update()
        return true
    }

    handleExternalNewUserValue(values: unknown):void {
        console.log('external value', values)
        // this.messageService.warn('External new user values are not implemented')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleExternalStop(message: string): void {
        message
        // TODO this.messageService.error('Stopped simulation because of exception on LS. You might want to reload the window.') TODO
        // this.messageService.error(message)
        this.setValuesToStopSimulation()
    }

    openInternalKVizView(): void {
        // TODO not possible without extention
    }

    openExternalKVizView(): void {
        this.lsClient.onReady().then(() => {
            this.lsClient.sendNotification('keith/simulation/startVisualizationServer')
        })
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:5010/visualization'))
    }

    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri
            .file(path.join(this.context.extensionPath, ...segments));
    }

}

export class SimulationTreeData extends vscode.TreeItem {
    constructor(
        public label: string,
        public id: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public data: any[],
        public input: boolean,
        public output: boolean,
        public categories: string[],
    ) {
        super(label, collapsibleState);
        this.tooltip = `Set ${this.label} to...`;
    }
}