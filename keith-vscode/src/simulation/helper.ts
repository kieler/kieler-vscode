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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
/**
 * In an asynchronous context this method can be called to wait for some time.
 * @param ms wait time in ms
 */
export function delay(ms: number): Promise<unknown> {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function strMapToObj(strMap: Map<string, unknown>): unknown {
    const obj = Object.create(null)
    strMap.forEach((v, k) => {
        obj[k] = v
    })
    return obj
}

export function strMapToJson(strMap: Map<string, unknown>): string {
    return JSON.stringify(strMapToObj(strMap))
}

export function isInternal(data: SimulationData): boolean {
    return (
        data.categories.includes('guard') ||
        data.categories.includes('sccharts-generated') ||
        data.categories.includes('term') ||
        data.categories.includes('ticktime')
    )
}

export function reverse(array: unknown[]): unknown[] {
    return array.map((item, idx) => array[array.length - 1 - idx])
}

export function getNonce(): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

/**
 * Internal data structure to save all data required to display a simulation in the siulation view.
 */
export class SimulationData {
    constructor(public data: unknown[], public input: boolean, public output: boolean, public categories: string[]) {}
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
    constructor(public name: string, public symbols: string[]) {}
}

/**
 * Message is used as a request and response parameter for a simulation step.
 */
export class SimulationStepMessage {
    constructor(public values: Record<string, unknown>) {}
}

/**
 * Message send by the LS whenever a simulation is stopped.
 */
export class SimulationStoppedMessage {
    constructor(public successful: boolean, public message: string) {}
}

export const SimulationDataBlackList: string[] = ['#interface']

/**
 * Message sent by the LS as a response to a load trace message, containing the structure of the loaded trace.
 */
export class LoadedTraceMessage {
    constructor(
        /* The trace object loaded into the system. */
        public trace: Trace,
        /* If loading the trace was successful. */
        public successful: boolean,
        /* Human-readable reason why loading failed (if it failed). */
        public reason: string
    ) {}
}

/**
 * Message sent by the LS as a response to save the current trace to a file.
 */
export class SavedTraceMessage {
    constructor(
        /* If saving the trace was successful. */
        public successful: boolean,
        /* Human-readable reason why saving failed (if it failed). */
        public reason: string
    ) {}
}

/**
 * A simulation trace as defined by the ktrace language.
 */
export class Trace {
    ticks: Tick[]
}

/**
 * Data during a single tick for in/outputs of a trace.
 */
export class Tick {
    name: string

    inputs: Assignment[]

    outputs: Assignment[]

    goto: Tick // TODO: this probably needs to be converted to some ID instead (the name for example if that is unique or the index in its trace)
}

export class Assignment {
    // and so on... // TODO:
}
