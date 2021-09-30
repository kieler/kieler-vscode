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

import { SimulationData } from "./simulation-view-provider";

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