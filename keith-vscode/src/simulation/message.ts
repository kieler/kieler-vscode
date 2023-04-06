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

export interface SimulationTableData {
    key: string
    data: Map<string, SimulationData>
    inputOutputColumnEnabled: boolean
    valuesForNextStep: Map<string, unknown>
}

export function isSimulationData(object: unknown): object is SimulationTableData {
    return (
        typeof object === 'object' &&
        object !== undefined &&
        object !== null &&
        'key' in object &&
        'data' in object &&
        'inputOutputColumnEnabled' in object &&
        'valuesForNextStep' in object
    ) // TODO really check the type if needed
}
