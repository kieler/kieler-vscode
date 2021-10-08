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
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { CompilationDataProvider, CompilationSystem } from '../kico/compilation-data-provider';
import { ADD_CO_SIMULATION, COMPILE_AND_SIMULATE, COMPILE_AND_SIMULATE_SNAPSHOT, OPEN_EXTERNAL_KVIZ_VIEW, OPEN_INTERNAL_KVIZ_VIEW, SIMULATE } from './commands';
import { delay, strMapToObj } from './helper';
import { PerformActionAction } from '../perform-action-handler'
import { SimulationWebView } from './simulation-view';

export const externalStepMessageType = 'keith/simulation/didStep';
export const valuesForNextStepMessageType = 'keith/simulation/valuesForNextStep';
export const externalStopMessageType = 'keith/simulation/externalStop';
export const startedSimulationMessageType = 'keith/simulation/started';

export class SimulationWebViewProvider implements vscode.WebviewViewProvider {

    protected readonly onRequestSimulationSystemsEmitter = new vscode.EventEmitter<this | undefined>()

    /**
     * Trace for each symbol.
     */
    public simulationData: Map<string, SimulationData> = new Map

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
    public simulationStepDelay = 200

    /**
     * All simulation types
     */
    public simulationTypes: string[] = ["Periodic", "Manual", "Dynamic"]

    /**
     * The currently selected simulation type.
     * The value of this attribute is simulation type selected by default.
     */
    public simulationType = "Periodic"

    readonly onDidChangeOpenStateEmitter = new vscode.EventEmitter<boolean>()

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
     */
    public simulationRunning = false

    /**
     * Show internal variables of simulation (e.g. guards, ...)
     */
    public showInternalVariables = false

    /**
     * Categories of variables with their respective members.
     */
    public categories: string[] = []

    public simulationStep = -1

    public compilingSimulation = false

    simulationCommands: vscode.Command[] = []

    startTime = 0
    endTime = 0



	public static readonly viewType = 'kieler-simulation';

	private _view?: vscode.WebviewView;
	private simulationView: SimulationWebView;

    public kico: CompilationDataProvider

    private lsClient: LanguageClient

    private systems: CompilationSystem[] = []

    private snapshotSystems: CompilationSystem[] = []


	constructor(private readonly _extensionUri: vscode.Uri, lsClient: LanguageClient, kico: CompilationDataProvider, readonly context: vscode.ExtensionContext) {
        console.log('Simulation view is created')
        this.simulationView = new SimulationWebView(this)
        // TODO
        this.lsClient = lsClient
        this.kico = kico
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
            }, this));


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
            vscode.commands.registerCommand(ADD_CO_SIMULATION.command, this.handleAddCoSimulation, this)
        )
    }



	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		this._view = webviewView;
        context
        _token
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this.getExtensionFileUri("dist")
			],
		};
        this.update()
	}

    public update(): void {
        if (this._view) {
            this._view.webview.html = this.simulationView.getHtmlForSimulationView(this._view.webview);
        }
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
        // this.statusbar.removeElement('simulation-status') TODO
    }

    /**
     * Called after a compilation process was started
     */
    compilationStarted(): void {
        // this.simulationWidget.update() TODO
    }

    /**
     * Called after compilation finished.
     */
    compilationFinished(successful: boolean): void {
        if (this.compilingSimulation) {
            // If a simulation systems is currently compiling one has to simulate it afterwards
            this.compilingSimulation = false
            // TODO this.update()
            if (successful) {
                vscode.commands.executeCommand(SIMULATE.command)
            }
        } else {
            // TODO this.update()
        }
    }

    async handleAddCoSimulation(action: PerformActionAction): Promise<void> {
        action
        // Uri of simulation file TODO
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
            // this.statusbar.setElement('simulation-status', { TODO
            //     alignment: StatusBarAlignment.LEFT,
            //     priority: simulationStatusPriority,
            //     text: '$(spinner fa-pulse fa-fw) Starting simulation...',
            //     tooltip: 'Starting simulation...',
            //     command: REVEAL_SIMULATION_WIDGET.id
            // })
            
        } else {
            // this.statusbar.setElement('simulation-status', { TODO
            //     alignment: StatusBarAlignment.LEFT,
            //     priority: simulationStatusPriority,
            //     text: `$(times) ${this.kicoolContribution.editor ? 'Simulation already running' : 'No editor defined'}`,
            //     tooltip: 'Did not simulate.',
            //     command: REVEAL_SIMULATION_WIDGET.id
            // })
        }
    }

    /**
     * Start simulation after server successfully started it.
     */
    async handleSimulationStarted(startMessage: SimulationStartedMessage): Promise<void> {
        this.endTime = Date.now()
        if (!startMessage.successful) {
            this.startTime = Date.now()
            // this.messageService.error(startMessage.error) TODO
            // this.statusbar.setElement('simulation-status', {
            //     alignment: StatusBarAlignment.LEFT,
            //     priority: simulationStatusPriority,
            //     text: `$(cross) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulation could not be started`,
            //     command: REVEAL_SIMULATION_WIDGET.id
            // })
            return
        } else {
            // this.statusbar.setElement('simulation-status', { TODO
            //     alignment: StatusBarAlignment.LEFT,
            //     priority: simulationStatusPriority,
            //     text: `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulating...`,
            //     command: REVEAL_SIMULATION_WIDGET.id
            // })
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
            const newData: SimulationData = {data: [], input: inputs.includes(key), output: outputs.includes(key), categories: categoriesList}
            this.simulationData.set(key, newData)
            // Set the value for which will be set for the next step for inputs
            if (inputs.includes(key)) {
                this.valuesForNextStep.set(key, value)
            }
            this.controlsEnabled = true
        })
        this.simulationRunning = true
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
        // this.simulationWidget.update() TODO
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation(): Promise<void> {
        this.setValuesToStopSimulation()
        // this.statusbar.setElement('simulation-status', {
        //     alignment: StatusBarAlignment.LEFT,
        //     priority: simulationStatusPriority,
        //     text: '$(spinner fa-pulse fa-fw) Stopping simulation...',
        //     tooltip: 'Request to stop the simulation is about to be send',
        //     command: REVEAL_SIMULATION_WIDGET.id
        // })
        const lClient = await this.lsClient
        const message: SimulationStoppedMessage = await lClient.sendRequest('keith/simulation/stop') as SimulationStoppedMessage
        if (!message.successful) {
            // this.messageService.error(message.message) TODO
        }
        // this.simulationWidget.update() TODO
        // this.statusbar.setElement('simulation-status', { TODO
        //     alignment: StatusBarAlignment.LEFT,
        //     priority: simulationStatusPriority,
        //     text: 'Stopped simulation',
        //     command: REVEAL_SIMULATION_WIDGET.id
        // })
    }

    private setValuesToStopSimulation(): void {
        // Stop all simulation, i.e. empty maps and kill simulation process on LS
        this.valuesForNextStep.clear()
        this.simulationData.clear()
        this.play = false
        this.controlsEnabled = false
        this.simulationRunning = false
    }

    /**
     * Toggles play.
     * Begins to execute steps while waiting simulationWidget.simulationDelay between each step.
     */
    async startOrPauseSimulation(): Promise<void> {
        this.play = !this.play
        // this.simulationWidget.update() TODO
        if (this.play) {
            await this.waitForNextStep()
        }
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
                    // TODO test whether this is what I want, I want the outer function to return false in the other case
                } else {
                    // This should not happen. An unexpected value was send by the server.
                    this.stopSimulation()
                    // this.messageService.error("Unexpected value for " + key + "in simulation data, stopping simulation") TODO
                    // this.simulationWidget.update()
                    // TODO how to stop this correctly?
                }
            });
        } else {
            // this.messageService.error('Simulation data values are undefined') TODO
        }
        if (!this.simulationRunning) {
            return false
        }
        this.simulationStep++
        this.changedValuesForNextStep.clear()
        // this.simulationWidget.update() TODO
        return true
    }

    handleExternalNewUserValue(values: unknown):void {
        console.log('external value', values)
        // this.messageService.warn('External new user values are not implemented')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleExternalStop(message: string): void {
        message
        // this.messageService.error('Stopped simulation because of exception on LS. You might want to reload the window.') TODO
        // this.messageService.error(message)
        this.setValuesToStopSimulation()
    }

    openInternalKVizView(): void {
        // TODO not possible without extention
    }

    openExternalKVizView(): void {
        // TODO test
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:5010/visualization'))
    }

}

/**
 * Internal data structure to save all data required to display a simulation in the siulation view.
 */
 export class SimulationData {
    constructor(
        public data: any[],
        public input: boolean,
        public output: boolean,
        public categories: string[]
    ) {
    }
}

/**
 * Message send by the LS when a simulation is started.
 */
export class SimulationStartedMessage {
    constructor(
        public successful: boolean,
        public error: string,
        public dataPool: Record<string, unknown>,
        public propertySet: Map<string, string[]>
    ) {}
}

export class Category {
    constructor(
        public name: string,
        public symbols: string[]
    ) {
    }
}

/**
 * Message is used as a request and response parameter for a simulation step.
 */
export class SimulationStepMessage {
    constructor(
        public values: Record<string, unknown>
    ) {}
}

/**
 * Message send by the LS whenever a simulation is stopped.
 */
export class SimulationStoppedMessage {
    constructor(
        public successful: boolean,
        public message: string
    ) {}
}

export const SimulationDataBlackList: string[]  = ["#interface"]