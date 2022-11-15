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

import { SimulationData } from './helper'

// Holds all messages between the simulation view and the simulation provider

export interface WebviewReadyMessage {
    readyMessage: string
}

export function isWebviewReadyMessage(object: any): object is WebviewReadyMessage {
    /* eslint no-prototype-builtins: "off" */
    return object !== undefined && object.hasOwnProperty('readyMessage')
}

export interface SimulationTableData {
    key: string
    data: Map<string, SimulationData>
    inputOutputColumnEnabled: boolean
    valuesForNextStep: Map<string, any>
}

export function isSimulationData(object: any): object is SimulationTableData {
    return (
        object !== undefined &&
        object.hasOwnProperty('key') &&
        object.hasOwnProperty('data') &&
        object.hasOwnProperty('inputOutputColumnEnabled') &&
        object.hasOwnProperty('valuesForNextStep')
    ) // TODO really check the type if needed
}
