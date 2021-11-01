import * as vscode from 'vscode';
import { Tuple } from './util';
  
/**
 * Type for enforcing list of settings.
 */
type SettingList<S> = Tuple<Extract<keyof S, string>>;

/**
 * Service for providing an interface for retrieving and updating VSC settings.
 */
export class SettingsService<S> {

    /**
     * Cache for settings, so no calls to API are needed upon requests for values of settings.
     */
    private readonly cache: Map<string, any>;

    /**
     * Initialize a new wrapper around the settings API of VSC for a specific configuration with built-in caching.
     * 
     * @param configurationKey key ('namespace') of the configuration. Supports dot-notation
     * @param settingKeys list of settings to manage. Note: This HAS to be an array containing 
     *                    the keys of all settings passed as the class generic.
     */
    constructor(private readonly configurationKey: string, settingKeys: SettingList<S>) {
        this.cache = new Map();
        
        // read current settings into cache
        const configuration = vscode.workspace.getConfiguration(configurationKey);
        for (const key of settingKeys as string[]) {
            this.cache.set(key, configuration.get(key));
        }
        
        // register listener for setting changes
        vscode.workspace.onDidChangeConfiguration(e => {
            // get current workspace configuration and iterate over current cache
            const configuration = vscode.workspace.getConfiguration(this.configurationKey);
            for (const key of this.cache.keys()) {
                // update cache, if settings are changed
                const setting = `${this.configurationKey}`;
                if (e.affectsConfiguration(setting)) {
                    this.cache.set(key, configuration.get(key));
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
        return this.cache.get(key);
    }

    /**
     * Set the value of a setting in VSC.
     * 
     * @param key key of the setting
     * @param value new value of the setting
     */
    public set<K extends Extract<keyof S, string>>(key: K, value: S[K]): void {
        vscode.workspace.getConfiguration(this.configurationKey).update(key, value);
    }
}
