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

/**
 * In an asynchronous context this method can be called to wait for some time.
 * @param ms wait time in ms
 */
export function delay(ms: number): Promise<unknown> {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function strMapToObj(strMap: Map<string, any>): any {
    const obj = Object.create(null);
    strMap.forEach((v, k) => {
        obj[k] = v
    });
    return obj;
}

export function strMapToJson(strMap: Map<string, any>): string {
    return JSON.stringify(strMapToObj(strMap));
}

export function isInternal(data: SimulationData): boolean {
    return data.categories.includes("guard") || data.categories.includes("sccharts-generated") || data.categories.includes("term") || data.categories.includes("ticktime")
}

export function reverse(array: any[]): any[] {
    return array.map((item, idx) => {
        item // use item
        return array[array.length - 1 - idx]
    })
}

export function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
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