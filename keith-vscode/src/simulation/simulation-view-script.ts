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

import { reverse, SimulationData } from "./helper";
import { isSimulationData } from "./message";

declare const acquireVsCodeApi: any;
const vscodeApi = acquireVsCodeApi();


export function newInputFor(key: string): void {
    vscodeApi.postMessage({key: key, type: "input"})
}


document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.getElementsByTagName('button')
    for (let i = 0; i < buttons.length; i++) {
        const key = buttons[i].getAttribute('key')
        if (key) {
            buttons[i].addEventListener('click', () => newInputFor(key))
        }
    }
});

/**
 * Use webpack to build a js file from this that is included in the html of the SimulationWebView
 * This is used to communicate with the rest of the extension
 */
export class SimulationViewStarter {


/* eslint @typescript-eslint/no-unused-vars: 0*/

    constructor() {
        // this.sendReadyMessage();
        this.waitForStuff();
    }

    // protected sendReadyMessage(): void {
    //     console.log('I am ready')
    //     vscodeApi.postMessage({ readyMessage: 'Simulation view ready' } as any);
    // }

    protected waitForStuff(): void {
        console.log('Waiting stuff...');
        const eventListener = (message: MessageEvent) => {
            console.log("A fun message that is handled", message)
            if (isSimulationData(message.data)) {
                const table = document.getElementById('simulation-table')
                if (table) {
                    // table.innerHTML = "trst" //renderSimulationData()
                    const head = table.children[0]
                    const body = table.children[1]
                    console.log(head, body)
                    if (!body) return;
                    console.log("Starting with body")
                    for (let i = 0; i < body.children.length; i++) {
                        const element = body.children[i]
                        console.log(element.id, "message.data", message.data)
                        console.log(message.data.data.get(element.id))
                        // if (true || typeof message.data.get(element.id) === "boolean") {
                            const key = element.id
                            const data = message.data.data.get(key) as SimulationData
                            element.innerHTML = `<tr id="${key}" key="${key}" class="simulation-data-row">
                            ${this.renderInputOutputColumn(data)}
                            ${this.renderLabelColumn(key)}
                            <td key="input" class="simulation-data-truncate simulation-td">
                                <div>
                                    <button id=${"input-box-" + key}
                                        title="input"
                                        class="newInputFor(${key})" 
                                        onClick="console.log(${key})")} readOnly="${!data.input}" size="1">Input</button>
                                </div>
                            </td>
                            ${this.renderLastValueColumn(data)}
                            ${this.renderHistoryColumn(data, key)}
                        </tr>`
                        // }
                        for (let j = 0; j < element.children.length; j++) {
                            // Always six children
                            

                        }
                    }
                    // for (let item of body.children) {
                    // }
                        // console.log('node name', node)
                        // TODO each node in the
                        // TODO if node has id of data element, replace values by data element
                        // If not in data, remove? should not occur
                        // 
                    //     console.log("Test", node, message.data)
                    // })
                } else {
                    console.log('no table', message.data)
                }
            } else  {
            // TODO
            }
        };
        window.addEventListener('message', eventListener);
    }

    renderInputOutputColumn(data: SimulationData): string {
        console.log("Renderinput")
        return `<td key="input-output" class="simulation-data-truncate simulation-td" align="left">
                <div>
                    ${data.input ? `<div class='icon fa fa-sign-in'></div>` : ""}
                    ${data.output ? `<div class='icon fa fa-sign-out'></div>` : ""}
                    ${data.categories}
                </div>
            </td>`
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
}

new SimulationViewStarter()
