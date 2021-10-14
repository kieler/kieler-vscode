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
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SimulationData, SimulationDataBlackList, isInternal, reverse } from './helper';

// TODO this is not really debuggable since it is not included in the source map

declare const acquireVsCodeApi: any;
const vscodeApi = acquireVsCodeApi();

// TODO Get values via vscodeApi.getState/setState or somewhere else
const simulationData: Map<string, SimulationData> = new Map
simulationData.set("free", new SimulationData([[true]], true, true, ['free', 'fun', 'facts']))
simulationData.set("fun", new SimulationData([1, 2, 3], true, true, ['free', 'fun', 'facts']))
simulationData.set("facts", new SimulationData([true], true, true, ['free', 'fun', 'facts']))
const showInternalVariables = false
const valuesForNextStep: Map<string, any> = new Map
valuesForNextStep.set("free", [true])
valuesForNextStep.set("fun", [3])
valuesForNextStep.set("facts", true)
const inputOutputColumnEnabled = false

/**
 * Map which holds wether a event listener is registered for a symbol
 */
const eventListenerRegistered: Map<string, boolean> = new Map

export function newInputFor(key: string): void {
    vscodeApi.postMessage({key: key, type: "input"})
}

class SimulationView extends React.Component {
    public render() {
        console.log("Fun")
        return (
        renderSimulationData(simulationData, showInternalVariables, valuesForNextStep, inputOutputColumnEnabled)
        );
    }


    componentDidMount() {
        window.addEventListener('load', this.handleLoad);
    }

    componentWillUnmount() { 
    window.removeEventListener('load', this.handleLoad)  
    }

    handleLoad() {
        // TODO text fields
        const inputFields = document.getElementsByTagName('input')
        console.log('Finding input fields', inputFields)
    
        for (let i = 0; i < inputFields.length; i++) {
            const key = inputFields[i].getAttribute('id')
            console.log(key, inputFields[i].hasAttribute('readonly'))
            if (key && inputFields[i].getAttribute('type') === 'button') {
                console.log('Found button')
                inputFields[i].addEventListener('click', () => newInputFor(key))
            } else if (key && inputFields[i].getAttribute('type') === 'text' && !inputFields[i].hasAttribute('readonly')) {
                console.log('Found text field')
                inputFields[i].addEventListener('click', () => setContentOfInputbox(key))
            }
        }
    }
}

// Renders react thingy in element with id simulation-container
ReactDOM.render(
    <SimulationView/>,
    document.getElementById('simulation-container') as HTMLElement
);

export function renderSimulationData(simulationData: Map<string, SimulationData>, showInternalVariables: boolean, valuesForNextStep: Map<string, any>,
    inputOutputColumnEnabled: boolean): React.ReactNode {
    const list: React.ReactNode[] = []
    if (simulationData.size === 0) {
        return <table></table>
    } else {
        simulationData.forEach((data, key) => {
            const onBlackList = SimulationDataBlackList.includes(key)
            // only add data that if input, output or internal data should be shown
            if (!onBlackList && (showInternalVariables || !isInternal(data))) {
                // nextStep is never undefined
                const nextStep = valuesForNextStep.get(key)
                let node: React.ReactNode;
                if (typeof nextStep === "boolean") { // boolean values are rendered as buttons
                    node = <tr key={key+ "-tr"} className="simulation-data-row">
                        {renderInputOutputColumn(data, inputOutputColumnEnabled)}
                        {renderLabelColumn(key)}
                        {renderLastValueColumn(data)}
                        <td key="input" className="simulation-data-truncate simulation-td">
                            <div>
                                <input id={key}
                                    key={key}
                                    title={JSON.stringify(nextStep)}
                                    value={JSON.stringify(nextStep)}
                                    className={"simulation-data-button"}
                                    type='button'
                                    placeholder="" readOnly={!data.input} size={1}/>
                            </div>
                        </td>
                        {renderValueForNextStepColumn(nextStep)}
                        {renderHistoryColumn(data, key)}
                    </tr>
                } else {
                    node = <tr key={key + "-tr"} className="simulation-data-row">
                        {renderInputOutputColumn(data, inputOutputColumnEnabled)}
                        {renderLabelColumn(key)}
                        {renderLastValueColumn(data)}
                        <td key="input" className="simulation-data-truncate simulation-td">
                            <div>
                                <input id={key}
                                    key={key}
                                    className={"simulation-data-inputbox" + (!data.input ? " inactive-input-box" : "")}
                                    type='text'
                                    placeholder="" readOnly={!data.input} size={1}/>
                            </div>
                        </td>
                        {renderValueForNextStepColumn(nextStep)}
                        {renderHistoryColumn(data, key)}
                    </tr>
                }
                list.push(node)
            }
        })
        return <table className={"simulation-data-table"}>
            <thead>
                <tr key="headings" className="simulation-data-row">
                    {renderInputOutputColumnHeader(inputOutputColumnEnabled)}
                    <th key="label" className="simulation-data-truncate setwidth" align="left" ><div className="simulation-div">Symbol</div></th>

                    <th key="value" className="simulation-data-truncate setwidth" align="left"><div className="simulation-div">Last</div></th>

                    <th key="input" className="simulation-data-truncate setwidth" align="left"><div>Input</div></th>

                    <th key="next-step" className="simulation-data-truncate setwidth" align="left"><div className="simulation-div">Next</div></th>

                    <th key="history" className="simulation-data-truncate history setwidth-h" align="left"><div className="simulation-div">History</div></th>
                </tr>
            </thead>
            <tbody>
                {list}
            </tbody>
        </table>
    }
}

function renderInputOutputColumn(data: SimulationData, inputOutputColumnEnabled: boolean): React.ReactNode {
    if (inputOutputColumnEnabled) {
        return <td key="input-output" className="simulation-data-truncate simulation-td" align="left">
                <div>
                    {data.input ? `<div className='icon fa fa-sign-in'></div>` : ""}
                    {data.output ? `<div className='icon fa fa-sign-out'></div>` : ""}
                    {data.categories}
                </div>
            </td>
    } else {
        return <td></td>
    }
}

function renderLabelColumn(key: string): React.ReactNode {
    return <th key="label" className="simulation-data-truncate" align="left"><div>{key}</div></th>
}

function renderLastValueColumn(data: SimulationData): React.ReactNode {
    return <td key="value" className="simulation-data-truncate simulation-td">
        {data.data ? JSON.stringify(data.data[data.data.length - 1]) : ""}
    </td>
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function renderValueForNextStepColumn(nextStep: any): React.ReactNode {
    return <td key="next-step" className="simulation-data-truncate simulation-td"><div>{JSON.stringify(nextStep)}</div></td>
}

function renderHistoryColumn(data: SimulationData, key: string): React.ReactNode {
    return <td key="history" className="simulation-data-truncate history simulation-td">
        <div>
            <input id={"input-box-history" + key}
                    className={"simulation-history-inputbox inactive-input-box"}
                    type='text'
                    value={data.data ? JSON.stringify(reverse(data.data)) : ""}
                    placeholder={""} readOnly size={1}/>
        </div></td>
}

function renderInputOutputColumnHeader(inputOutputColumnEnabled: boolean): React.ReactNode {
    if (inputOutputColumnEnabled) {
        return <th key="input-output" className="simulation-data-truncate setwidth" align="left"><div className="simulation-div">I/O</div></th>
    } else {
        return <th></th>
    }
}



/**
 * Set in values in the next step. On click the current nextValue is set as value of the inputbox.
 * One can be sure that the LS handles the type checking.
 */
function setContentOfInputbox(key: string): void {
    const currentNextValue = valuesForNextStep.get(key)
    const elem = document.getElementById(key) as HTMLInputElement
    // set value that is the current value that will be set next tick as value of inputbox
    // Add event listener for inputbox
    // on enter the current value of the inputbox should be set as value for the next step
    const isRegistered = eventListenerRegistered.get(key)
    if (!isRegistered) {
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
                    const currentNextValue = valuesForNextStep.get(key)
                    elem.value = JSON.stringify(currentNextValue)
                    // TODO send message vscode.window.showErrorMessage(error.toString())
                    return
                }
                // always assume that the parsed value is valid
                valuesForNextStep.set(key, parsedValue)
                // TODO communicate value change changedValuesForNextStep.set(key, parsedValue)
                elem.placeholder = JSON.stringify(parsedValue)
                // TODO update()
            }
        })
        eventListenerRegistered.set(key, true)
    }
}