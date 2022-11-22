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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { Memento } from 'vscode'

type STORAGE_ITEMS = {
    'keith.vscode.compilation.auto': boolean
    'keith.vscode.compilation.inplace': boolean
    'keith.vscode.compilation.showResultingModel': boolean
    'keith.vscode.compilation.showButtons': boolean
    'keith.vscode.compilation.showPrivateSystems': boolean
    'keith.vscode.simulation.simulationStepDelay': number
    'keith.vscode.simulation.simulationType': string
    'keith.vscode.simulation.showInternalVariables': boolean
}

/**
 * Wrapper around the Memento API provided by VSCode.
 * @deprecated
 */
export class StorageService {
    constructor(private memento: Memento) {}

    /**
     * Store a simple key-value-pair.
     *
     * @param key key of the item to put into storage
     * @param value value to store
     */
    public async put<K extends keyof STORAGE_ITEMS>(key: K, value: STORAGE_ITEMS[K]): Promise<void> {
        await this.memento.update(key, value)
    }

    /**
     * Retrieve a value from the storage
     * @param key key under which the value is stored
     * @param defaultValue a default value, if there is no value in storage
     */
    public get<K extends keyof STORAGE_ITEMS>(key: K, defaultValue: STORAGE_ITEMS[K]): STORAGE_ITEMS[K]

    public get<K extends keyof STORAGE_ITEMS>(key: K, defaultValue?: STORAGE_ITEMS[K]): STORAGE_ITEMS[K] | undefined {
        return this.memento.get<STORAGE_ITEMS[K]>(key) ?? defaultValue
    }
}
