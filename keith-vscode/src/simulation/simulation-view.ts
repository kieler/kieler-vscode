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
// /** @jsx svg */
// import { svg } from 'snabbdom-jsx'; // eslint-disable-line @typescript-eslint/no-unused-vars
// import * as React from 'react';
import * as vscode from 'vscode';
import { isInternal, reverse } from './helper';
import { SimulationData, SimulationDataBlackList, SimulationWebViewProvider } from './simulation-view-provider';
import { SELECT_SIMULATION_CHAIN, SIMULATE } from './commands';


export class SimulationWebView {

    private webview?: vscode.Webview

    constructor(private readonly viewProvider: SimulationWebViewProvider) {
    }

    getHtmlForSimulationView(webview: vscode.Webview): string {
        this.webview = webview
        this.viewProvider.kico.showButtons = true
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'src/simulation/style', 'index.css'));
		const compilerStyĺeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'src/kico/style', 'index.css'));
		const script = webview.asWebviewUri(vscode.Uri.joinPath(this.viewProvider._extensionUri, 'dist', 'simulation-view.js'));
        return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, height=device-height">
                <title>Simulation</title>
                <link
                    rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
                    integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
                    crossorigin="anonymous">
                    <link href="${styleMainUri}" rel="stylesheet">
                    <link href="${compilerStyĺeUri}" rel="stylesheet">
            </head>
            <body>
                <script src="${script}"></script>
                <div id="simulation_container" style="height: 100%;"></div>
                <div>${!this.viewProvider.kico ? `<div></div>` :
                `<div class="simulation-widget">
                        ${this.renderSimulationPanel()}
                        ${!this.viewProvider.kico.showButtons ||
                            this.viewProvider.kico.compiling ||
                            this.viewProvider.simulationRunning || this.viewProvider .compilingSimulation ? `` : this.renderSimulationButton()}
                        ${!!this.viewProvider.kico.showButtons &&
                            this.viewProvider.kico.lastInvokedCompilation.includes("simulation") &&
                            !this.viewProvider.simulationRunning && !this.viewProvider .compilingSimulation ? this.renderRestartButton() : ``}
                        ${this.viewProvider .simulationRunning ? this.renderStepCounter() : ``}
                    <div key="table" class="simulation-table">${this.renderSimulationData()}</div>
                </div>`}</div>
            </body>
        </html>`
        // TODO
        // this.webview = webview
        // if (!this.viewProvider.kico) {
        //     return <div></div>
        // } else {
        //     return <div>
        //         {this.renderSimulationPanel()}
        //         <div key="table" class="simulation-table">{this.renderSimulationData()}</div>
        //     </div>
        // }
    }

    /**
     * Renders the control panel of the simulation widget.
     * The play/pause button is shown whenever a simulation is running.
     * Step, stop, and IO button are only shown if a simulation is running.
     * The simulation type selectbox and simulation speed input box are always shown.
     * The simulation compilation system selectbox and the compile button are only shown if no simulation is running.
     * The restart button is only shown if the last invoked compilation system is a simulation compilation system.
     * The step counter is only shown, if the simulation is running.
     */
    renderSimulationPanel(): string {
        return `<div class="simulation-panel">
            ${this.viewProvider.simulationRunning ? this.renderPlayPauseButton() : ``}
            ${this.viewProvider .simulationRunning ? this.renderStepButton() : ``}
            ${this.viewProvider .simulationRunning ? this.renderStopButton() : ``}
            ${this.viewProvider .simulationRunning ? this.renderIOButton() : ``}
            ${this.viewProvider .simulationRunning ? this.renderShowInternalButton() : ``}
            ${!this.viewProvider .kico.showButtons ||
                this.viewProvider .kico.compiling ||
                this.viewProvider .simulationRunning || this.viewProvider .compilingSimulation ? "" : this.renderSimulationButton()}
            ${!!this.viewProvider .kico.showButtons &&
                this.viewProvider .kico.lastInvokedCompilation.includes("simulation") &&
                !this.viewProvider .simulationRunning && !this.viewProvider .compilingSimulation ? this.renderRestartButton() : ``}
            ${this.viewProvider .simulationRunning ? this.renderStepCounter() : ``}
        </div>`
    }

    renderPlayPauseButton(): string {
        return `<div title=${this.viewProvider.play ? "Pause" : "Play"} key="play-pause-button" class="preference-button"
            onClick="${() => this.viewProvider.startOrPauseSimulation()}">
            <div class="${(this.viewProvider.play ? "fa-pause-circle" : "$(play)")}">P</div>
        </div>`
    }

    renderStepButton(): string {
        return `<div title="Step" key="step-button" class=${'preference-button'}
            onClick="${() => this.viewProvider.executeSimulationStep()}">
            <div class=${'icon fa fa-step-forward'}>S</div>
        </div>`
    }

    renderStopButton(): string {
        return `<div title="Stop" key="stop-button" class=${'preference-button'}
            onClick="${() => this.viewProvider.stopSimulation()}">
            <div class=${'icon fa fa-stop'}>O</div>
        </div>`
    }

    renderIOButton(): string {
        return `<div title=${"IO"}
            key="io-button" class=${'preference-button' + (this.viewProvider.inputOutputColumnEnabled ? '' : ' off')}
            onClick="${() => this.toggleIODisplayButton()}">
            <div class=${'icon fa fa-exchange'}>IO</div>
        </div>`
    }

    toggleIODisplayButton(): void {
        this.viewProvider.inputOutputColumnEnabled = !this.viewProvider.inputOutputColumnEnabled
        this.viewProvider.update()
    }

    renderShowInternalButton(): string {
        return `<div title=${this.viewProvider.showInternalVariables ? "Disable internal variables" : "Show internal variables"}
            key="toggle-internal-button" class=${'preference-button' + (this.viewProvider.showInternalVariables ? '' : ' off')}
            onClick="${() => this.toggleShowInternal()}">
            <div class=${'icon fa fa-cog'}></div>
        </div>`
    }

    toggleShowInternal(): void {
        this.viewProvider.showInternalVariables = !this.viewProvider.showInternalVariables
        this.viewProvider.update()
    }

    renderSimulationButton(): string {
        return `<div class=${'compile-button'} title="Simulate"
            onClick="${() => {
                vscode.commands.executeCommand(SELECT_SIMULATION_CHAIN.command)
            }}">
            <div class='icon fa fa-play-circle'> </div>
        </div>`
    }

    renderRestartButton(): string {
        return `<div class={'compile-button'} title="Restart"
            onClick="${() => {
                vscode.commands.executeCommand(SIMULATE.command)
            }}">
            <div class='icon rotate180 fa fa-reply'> </div>
        </div>`
    }

    renderSimulationData(): string {
        const list: string[] = []
        this.viewProvider.simulationData.set("fun", new SimulationData([1, 2, 3], true, true, ['free', 'fun', 'facts']))
        if (this.viewProvider.simulationData.size === 0) {
            return `<table></table>`
        } else {
            this.viewProvider.simulationData.forEach((data, key) => {
                const onBlackList = SimulationDataBlackList.includes(key) || key.startsWith('_')
                // only add data that if input, output or internal data should be shown
                if (!onBlackList && (this.viewProvider.showInternalVariables || !isInternal(data))) {
                    // nextStep is never undefined
                    const nextStep = this.viewProvider.valuesForNextStep.get(key)
                    let node: string;
                    if (typeof nextStep === "boolean") { // boolean values are rendered as buttons
                        node = `<tr key=${key} class="simulation-data-row">
                            ${this.renderInputOutputColumn(data)}
                            ${this.renderLabelColumn(key)}
                            ${this.renderLastValueColumn(data)}
                            <td key="input" class="simulation-data-truncate simulation-td">
                                <div>
                                    <input id=${"input-box-" + key}
                                        title=${JSON.stringify(nextStep)}
                                        value=${JSON.stringify(nextStep)}
                                        class=${"simulation-data-button"}
                                        type='button'
                                        onClick="${() => { this.setBooleanInput("input-box-" + key, key, nextStep as boolean) }}"
                                        placeholder="" readOnly=${!data.input} size=${1}><input>
                                </div>
                            </td>
                            ${this.renderValueForNextStepColumn(nextStep)}
                            ${this.renderHistoryColumn(data, key)}
                        </tr>`
                    } else {
                        node = `<tr key=${key} class="simulation-data-row">
                            ${this.renderInputOutputColumn(data)}
                            ${this.renderLabelColumn(key)}
                            ${this.renderLastValueColumn(data)}
                            <td key="input" class="simulation-data-truncate simulation-td">
                                <div>
                                    <input id=${"input-box-content" + key}
                                        class=${"simulation-data-inputbox" + (!data.input ? " inactive-input-box" : "")}
                                        type='text'
                                        onClick="${() => {
                                            // If the value is not an input. Nothing should happen on clicking the text field
                                            if (!data.input) {
                                                return
                                            }
                                            this.setContentOfInputbox("input-box-content" + key, key, nextStep)
                                        }}"
                                        placeholder="" readOnly=${!data.input} size=${1}></input>
                                </div>
                            </td>
                            ${this.renderValueForNextStepColumn(nextStep)}
                            ${this.renderHistoryColumn(data, key)}
                        </tr>`
                    }
                    list.push(node)
                }
            })
            return `<table class=${"simulation-data-table"}>
                <thead>
                    <tr key="headings" class="simulation-data-row">
                        ${this.renderInputOutputColumnHeader()}
                        <th key="label" class="simulation-data-truncate setwidth" align="left" ><div class="simulation-div">Symbol</div></th>

                        <th key="value" class="simulation-data-truncate setwidth" align="left"><div class="simulation-div">Last</div></th>

                        <th key="input" class="simulation-data-truncate setwidth" align="left"><div>Input</div></th>

                        <th key="next-step" class="simulation-data-truncate setwidth" align="left"><div class="simulation-div">Next</div></th>

                        <th key="history" class="simulation-data-truncate history setwidth-h" align="left"><div class="simulation-div">History</div></th>
                    </tr>
                </thead>
                <tbody>
                    ${list}
                </tbody>
            </table>`
        }
    }

    renderInputOutputColumn(data: SimulationData): string {
        if (this.viewProvider.inputOutputColumnEnabled) {
            return `<td key="input-output" class="simulation-data-truncate simulation-td" align="left">
                    <div>
                        ${data.input ? `<div class='icon fa fa-sign-in'></div>` : ""}
                        ${data.output ? `<div class='icon fa fa-sign-out'></div>` : ""}
                        ${data.categories}
                    </div>
                </td>`
        } else {
            return `<td></td>`
        }
    }

    renderLabelColumn(key: string): string {
        return `<th key="label" class="simulation-data-truncate" align="left"><div>${key}</div></th>`
    }

    renderLastValueColumn(data: SimulationData): string {
        return `<td key="value" class="simulation-data-truncate simulation-td">
            ${data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}
        </td>`
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    renderValueForNextStepColumn(nextStep: any): string {
        return `<td key="next-step" class="simulation-data-truncate simulation-td"><div>${JSON.stringify(nextStep)}</div></td>`
    }

    renderHistoryColumn(data: SimulationData, key: string): string {
        return `<td key="history" class="simulation-data-truncate history simulation-td">
            <div>
                <input id=${"input-box-history" + key}
                        class=${"simulation-history-inputbox inactive-input-box"}
                        type='text'
                        value=${data.data ? JSON.stringify(reverse(data.data)) : ""}
                        placeholder=${""} readOnly size=${1}></input>
            </div></td>`
    }

    renderInputOutputColumnHeader(): string {
        if (this.viewProvider.inputOutputColumnEnabled) {
            return `<th key="input-output" class="simulation-data-truncate setwidth" align="left"><div class="simulation-div">I/O</div></th>`
        } else {
            return `<th></th>`
        }
    }

    renderStepCounter(): string {
        return `<div title="Step Counter">
            <div class='step-counter'>${this.viewProvider.simulationStep}</div>
        </div>`
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setBooleanInput(id: string, key: string,  value: any/*, data: any*/): void {
        if (this.viewProvider.valuesForNextStep.has(key)) {
            // if the value is a boolean just toggle it on click
            this.viewProvider.valuesForNextStep.set(key, !value)
            this.viewProvider.changedValuesForNextStep.set(key, !value)
            this.viewProvider.update()
        }
    }


    /**
     * Set in values in the next step. On click the current nextValue is set as value of the inputbox.
     * One can be sure that the LS handles the type checking.
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setContentOfInputbox(id: string, key: string,  currentNextValue: any) {
        const elem = document.getElementById(id) as HTMLInputElement
        // set value that is the current value that will be set next tick as value of inputbox
        // Add event listener for inputbox
        // on enter the current value of the inputbox should be set as value for the next step
        const eventListenerRegistered = this.viewProvider.eventListenerRegistered.get(key)
        if (!eventListenerRegistered) {
            elem.value = JSON.stringify(currentNextValue)
            elem.addEventListener("keyup", (event) => {
                if (event.keyCode === 13) {
                    // prevents enter from doing things it should not do
                    event.preventDefault()
                    // parse value as JSON
                    let parsedValue
                    try {
                        parsedValue = JSON.parse(elem.value);
                    } catch (error: any) {
                        // return if not parsable
                        const currentNextValue = this.viewProvider.valuesForNextStep.get(key)
                        elem.value = JSON.stringify(currentNextValue)
                        // this.webview?.postMessage(error.toString())
                        return
                    }
                    // always assume that the parsed value is valid
                    this.viewProvider.valuesForNextStep.set(key, parsedValue)
                    this.viewProvider.changedValuesForNextStep.set(key, parsedValue)
                    elem.placeholder = JSON.stringify(parsedValue)
                    this.viewProvider.update()
                }
            })
        }
    }

}
