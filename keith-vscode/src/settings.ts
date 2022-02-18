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

import * as vscode from 'vscode'
import { Tuple } from './util'

/**
 * Type for enforcing list of settings.
 */
type SettingList<S> = Tuple<Extract<keyof S, string>>

/**
 * Service for providing an interface for retrieving and updating VSC settings.
 */
export class SettingsService<S> {
    /**
     * Cache for settings, so no calls to API are needed upon requests for values of settings.
     */
    private readonly cache: Map<string, any>

    /**
     * Initialize a new wrapper around the settings API of VSC for a specific configuration with built-in caching.
     *
     * @param configurationKey key ('namespace') of the configuration. Supports dot-notation
     * @param settingKeys list of settings to manage. Note: This HAS to be an array containing
     *                    the keys of all settings passed as the class generic.
     */
    constructor(private readonly configurationKey: string, settingKeys: SettingList<S>) {
        this.cache = new Map()

        // read current settings into cache
        const configuration = vscode.workspace.getConfiguration(configurationKey)
        for (const key of settingKeys as string[]) {
            this.cache.set(key, configuration.get(key))
        }

        // register listener for setting changes
        vscode.workspace.onDidChangeConfiguration((e) => {
            // get current workspace configuration and iterate over current cache
            const config = vscode.workspace.getConfiguration(this.configurationKey)
            for (const key of this.cache.keys()) {
                // update cache, if settings are changed
                const setting = `${this.configurationKey}`
                if (e.affectsConfiguration(setting)) {
                    this.cache.set(key, config.get(key))
                }
            }
        })
    }

    /**
     * Get the value of a setting from VSC.
     *
     * @param key key of the setting to get
     * @returns current value of the setting
     */
    public get<K extends Extract<keyof S, string>>(key: K): S[K] {
        return this.cache.get(key)
    }

    /**
     * Set the value of a setting in VSC.
     *
     * @param key key of the setting
     * @param value new value of the setting
     */
    public set<K extends Extract<keyof S, string>>(key: K, value: S[K]): void {
        const configurationTarget = this.determineConfigurationTarget(key)
        vscode.workspace.getConfiguration(this.configurationKey).update(key, value, configurationTarget)
    }

    /**
     * Determine the {@link vscode.ConfigurationTarget} for a specified configuration key.
     * The determined target is...
     *  - {@link vscode.ConfigurationTarget.WorkspaceFolder}, if there is configuration in one of the current workspace folders
     *  - {@link vscode.ConfigurationTarget.Workspace}, if there is a configuration in the current workspace
     *  - {@link vscode.ConfigurationTarget.Global} otherwise
     *
     * @param key key of the configuration
     * @returns the determined {@link vscode.ConfigurationTarget}
     */
    private determineConfigurationTarget<K extends Extract<keyof S, string>>(key: K): vscode.ConfigurationTarget {
        const inspection = vscode.workspace.getConfiguration(this.configurationKey).inspect(key)
        let configurationTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
        if (inspection?.workspaceFolderValue !== undefined) {
            configurationTarget = vscode.ConfigurationTarget.WorkspaceFolder
        } else if (inspection?.workspaceValue !== undefined) {
            configurationTarget = vscode.ConfigurationTarget.Workspace
        }
        return configurationTarget
    }
}
