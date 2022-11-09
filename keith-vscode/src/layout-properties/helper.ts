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

/**
 * In an asynchronous context this method can be called to wait for some time.
 * @param ms wait time in ms
 */
export function delay(ms: number): Promise<unknown> {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function strMapToObj(strMap: Map<string, any>): any {
    const obj = Object.create(null)
    strMap.forEach((v, k) => {
        obj[k] = v
    })
    return obj
}

export function strMapToJson(strMap: Map<string, any>): string {
    return JSON.stringify(strMapToObj(strMap))
}

export function reverse(array: any[]): any[] {
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
