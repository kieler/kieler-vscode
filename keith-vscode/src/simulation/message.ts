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

// Holds all messages between the simulation view and the simulation provider

export interface WebviewReadyMessage {
    readyMessage: string
}

export function isWebviewReadyMessage(object: any): object is WebviewReadyMessage {
    /*eslint no-prototype-builtins: "off"*/
    return object !== undefined && object.hasOwnProperty('readyMessage');
}