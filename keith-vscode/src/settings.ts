import * as vscode from 'vscode';

/**
 * Type for enforcing default settings.
 */
type DefaultSettings<S> = {
    [key in Extract<keyof S, string>]: S[key]
}

/**
 * Service for providing an interface for retrieving and updating VSC settings.
 */
export class SettingsService<S> {

    private readonly cache: Map<string, any>;
    private readonly configuration: vscode.WorkspaceConfiguration;

    /**
     * Initialize a new wrapper around the settings API of VSC for a specific configuration with built-in caching.
     * 
     * @param configurationKey key ('namespace') of the configuration. Supports dot-notation
     * @param defaultConfiguration default values for settings
     */
    constructor(configurationKey: string, defaultConfiguration: DefaultSettings<S>) {
        this.cache = new Map();
        for (const key in defaultConfiguration) {
            this.cache.set(key, (defaultConfiguration as any)[key])
        }
        // TODO lme: retrieve configuration during update
        this.configuration = vscode.workspace.getConfiguration(configurationKey);
        
        // register listener for setting changes
        vscode.workspace.onDidChangeConfiguration(e => {
            for (const key of this.cache.keys()) {
                // update cache, if settings are changed
                const setting = `${configurationKey}`;
                if (e.affectsConfiguration(setting)) {
                    this.cache.set(key, this.configuration.get(key));
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
        this.configuration.update(key, value);
    }
}
