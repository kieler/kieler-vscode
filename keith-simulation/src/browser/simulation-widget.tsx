/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

// import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { injectable, LazyServiceIdentifer, inject } from "inversify";
import { StatefulWidget, ReactWidget, Message} from "@theia/core/lib/browser";
import * as React from "react";
import { SimulationContribution } from "./simulation-contribution";
import { simulationWidgetId, SimulationData } from "../common"
import { Emitter } from "@theia/core";
import { Event } from '@theia/core/lib/common'


/**
 * Widget to compile and navigate compilation results. Should be linked to editor.
 */
@injectable()
export class SimulationWidget extends ReactWidget implements StatefulWidget {

    /**
     * Id of widget. Can be used to get an instance of this widget via the WidgetManager.
     */
    public static widgetId = simulationWidgetId


    protected readonly onRequestSimulationSystemsEmitter = new Emitter<SimulationWidget | undefined>()

    /**
     * Trace for each symbol.
     */
    public simulationData: Map<string, SimulationData> = new Map

    /**
     * Holds the value that is set in the next tick.
     * Assume that each value is never undefined, since the default value is set when the simulation is started
     */
    public valuesForNextStep: Map<string, any> = new Map

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
    protected play = false

    /**
     * Time in milliseconds to wait till next simulation step is requested in play mode.
     */
    protected simulationDelay: number = 100

    protected simulationTypes: string[] = ["Periodic", "Manual", "Dynamic"]

    /**
     * Emit when compilation systems are requested.
     */
    readonly requestSystemDescriptions: Event<SimulationWidget | undefined> = this.onRequestSimulationSystemsEmitter.event
    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>()

    constructor(
        @inject(new LazyServiceIdentifer(() => SimulationContribution)) protected readonly commands: SimulationContribution
    ) {
        super();
        this.id = simulationWidgetId
        this.title.label = 'Simulation'
        this.title.iconClass = 'fa fa-table ';
        this.addClass(simulationWidgetId) // class for index.css
        this.update()
    }

    protected render(): React.ReactNode {
        return <React.Fragment>
            {this.renderSimulationPanel()}
            <div key="table" className="simulation-table">{this.renderSimulationData()}</div>
        </React.Fragment>

    }

    renderSimulationPanel() {
        return <div className="simulation-panel">
            {this.renderPlayPauseButton()}
            {this.renderStepButton()}
            {this.renderStopButton()}
            {this.renderSimulationTypeSelectbox()}
            {this.renderSimulationSpeedInputbox()}
        </div>
    }
    renderPlayPauseButton(): React.ReactNode {
        return <div title={this.play ? "Pause" : "Play"} key="play-pause-button" className={'preference-button' + (this.play ? '' : ' off')}
            onClick={event => {
                this.play = !this.play
                // TODO start simulation thread or something
                this.update()
            }}>
            <div className={'icon fa ' + (this.play ? 'fa-play-circle' : 'fa-pause-circle')}/>
        </div>
    }
    renderStepButton(): React.ReactNode {
        return <div title="Step" key="step-button" className={'preference-button'}
            onClick={event => {
                // TODO send something to ls to step, await value and show it after that. This should be the same method which is used in play
                this.update()
            }}>
            <div className={'icon fa fa-step-forward'}/>
        </div>
    }
    renderStopButton(): React.ReactNode {
        return <div title="Stop" key="stop-button" className={'preference-button'}
            onClick={event => {
                // Stop all simulation, i.e. empty maps and kill simulation process on LS
                this.valuesForNextStep.clear()
                this.simulationData.clear()
                // TODO kill some executable process by requested its termination on the LS
                this.update()
            }}>
            <div className={'icon fa fa-stop'}/>
        </div>
    }
    renderSimulationTypeSelectbox(): React.ReactNode {
        let selectionList: React.ReactNode[] = []
        this.simulationTypes.forEach(type => {
            selectionList.push(
                <option value={type} key={type}>{type}</option>
            )
            // TODO do stuff
        })
        return <div>
            <select id="simulation-type-list" className={'selection-list simulation-type-list'}
                onChange={() => this.handleSelectionOfSimulationType()} defaultValue={this.simulationTypes[0]}>
            {selectionList}
            </select>
        </div>
    }

    handleSelectionOfSimulationType(): void {
        throw new Error("Method not implemented.");
    }
    renderSimulationSpeedInputbox(): React.ReactNode {
        return <div></div>
    }

    renderSimulationData(): React.ReactNode {
        let list: React.ReactElement[] = []
        if (this.simulationData.size === 0) {

        } else {
            this.simulationData.forEach((data, key) => {
                // nextStep is never undefined
                let nextStep = this.valuesForNextStep.get(key)
                if (nextStep === undefined) {
                    this.valuesForNextStep.set(key, data.data[data.data.length - 1])
                    if (data.data.length > 0) {
                        nextStep = data.data[data.data.length - 1]
                    }
                }
                let node: React.ReactElement;
                if (typeof nextStep === "boolean") { // boolean values are rendered as buttons
                    node = <tr key={key} className="simulation-data-row">
                        <th key="label" className="simulation-data-box">{key}</th>
                        <td key="value" className="simulation-data-box">{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</td>
                        <td key="input" className="simulation-data-box">
                            <input id={"input-box-" + key}
                                title={data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}
                                className={"simulation-data-button"}
                                type='button'
                                onClick={() => { this.setBooleanInput("input-box-" + key, key, nextStep as boolean, data) }}
                                placeholder={""} />
                        </td>
                        <td key="history" className="simulation-data-box">{data.data ? JSON.stringify(data.data.reverse()) : ""}</td>
                        <td key="next-step" className="simulation-data-box">{JSON.stringify(nextStep)}</td>
                    </tr>
                } else {
                    node = <tr key={key} className="simulation-data-row">
                        <th key="label" className="simulation-data-box">{key}</th>
                        <td key="value" className="simulation-data-box">{data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}</td>
                        <td key="input" className="simulation-data-box">
                            <input id={"input-box-" + key}
                                title={data.data ? "Current value is " + JSON.stringify(data.data[data.data.length - 1]) : ""}
                                className={"simulation-data-inputbox"}
                                type='text'
                                onClick={() => { this.setContentOfInputbox("input-box-" + key, key, nextStep) }}
                                placeholder={""} />
                        </td>
                        <td key="history" className="simulation-data-box">{data.data ? JSON.stringify(data.data.reverse()) : ""}</td>
                        <td key="next-step" className="simulation-data-box">{JSON.stringify(nextStep)}</td>
                    </tr>
                }
                list.push(node)
            })
            return <table className={"simulation-data-table"}>
                <thead>
                    <tr key="headings" className="simulation-data-row">
                        <th key="label" className="simulation-data-box" align="left">Symbol</th>
                        <th key="value" className="simulation-data-box" align="left">Last Value</th>
                        <th key="input" className="simulation-data-box" align="left">Input</th>
                        <th key="history" className="simulation-data-box" align="left">History</th>
                        <th key="next-step" className="simulation-data-box" align="left">Value for Next Tick</th>
                    </tr>
                </thead>
                <tbody>
                    {list}
                </tbody>
            </table>
        }
    }

    setBooleanInput(id: string, key: string,  value: any, data: any) {
        // if the value is a boolean just toggle it on click
        const elem = document.getElementById(id) as HTMLInputElement
        elem.value = (!value).toString()
        this.valuesForNextStep.set(key, !value)
        this.update()
    }


    /**
     * Set in values in the next step. On click the current nextValue is set as value of the inputbox.
     * One can be sure that the LS handles the type checking.
     */
    setContentOfInputbox(id: string, key: string,  currentNextValue: any) {
        const elem = document.getElementById(id) as HTMLInputElement
        // set value that is the current value that will be set next tick as value of inputbox
        // Add event listener for inputbox
        // on enter the current value of the inputbox should be set as value for the next step
        const eventListenerRegistered = this.eventListenerRegistered.get(key)
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
                    } catch (error) {
                        // return if not parsable
                        const currentNextValue = this.valuesForNextStep.get(key)
                        elem.value = JSON.stringify(currentNextValue)
                        this.commands.message(error.toString(), "ERROR")
                        return
                    }
                    // always assume that the parsed value is valid
                    this.valuesForNextStep.set(key, parsedValue)
                    elem.placeholder = JSON.stringify(parsedValue)
                    this.update()
                }
            })
        }
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.update()
    }

    onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render()
    }

    storeState(): SimulationWidget.Data {
        return {
            displayInOut: this.displayInOut
        }
    }

    restoreState(oldState: SimulationWidget.Data): void {
        this.displayInOut = oldState.displayInOut
    }

    simulationDataToString(data: any) {
        if (data instanceof Array) {
            let returnValue = "["
            data.forEach((value, index) => {
                let innerString = ""
                if (value instanceof Array) {
                    innerString = this.simulationDataToString(value)
                } else {
                    if (index !== 0) {
                        innerString = ", "
                    }
                    innerString += value.toString()
                }
                returnValue = returnValue + innerString
            })
            return returnValue + "]"
        } else {
            return data.toString()
        }
    }
}
/**
 * Definition of the state of the corresponding {@link SimulationWidget}.
 */
export namespace SimulationWidget {
    export interface Data {
        displayInOut: boolean
    }
}