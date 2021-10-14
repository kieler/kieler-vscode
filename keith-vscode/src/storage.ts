import { Memento } from "vscode";

type STORAGE_ITEMS = {
    "keith.vscode.compilation.auto": boolean;
};

/**
 * Wrapper around the Memento API provided by VSCode. 
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
        await this.memento.update(key, value);
    }

    /**
     * Retrieve a value from the storage
     * @param key key under which the value is stored
     * @param defaultValue a default value, if there is no value in storage
     */
    public get<K extends keyof STORAGE_ITEMS>(key: K, defaultValue: STORAGE_ITEMS[K]): STORAGE_ITEMS[K];
    public get<K extends keyof STORAGE_ITEMS>(key: K, defaultValue?: STORAGE_ITEMS[K]): STORAGE_ITEMS[K] | undefined {
        return this.memento.get<STORAGE_ITEMS[K]>(key) ?? defaultValue;
    }
}
