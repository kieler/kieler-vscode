/* eslint-disable @typescript-eslint/no-namespace */
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

interface Action {
    kind: string;
}

/** Adds a row to the table. */
export interface AddRowAction extends Action {
    kind: typeof AddRowAction.KIND;
    rowId: string;
    values: string[];
}


export namespace AddRowAction {
    export const KIND = "addRow";

    export function create(
        rowId: string,
        values: string[]
    ): AddRowAction {
        return {
            kind: AddRowAction.KIND,
            rowId,
            values
        };
    }

    export function isThisAction(action: Action): action is AddRowAction {
        return action.kind === AddRowAction.KIND;
    }
}

/** Updates a cell of the table. A new cell is added if necessary */
export interface UpdateCellAction extends Action {
    kind: typeof UpdateCellAction.KIND;
    rowId: string;
    columnId: string;
    value: string;
}


export namespace UpdateCellAction {
    export const KIND = "updateCell";

    export function create(
        rowId: string,
        columnId: string,
        value: string
    ): UpdateCellAction {
        return {
            kind: UpdateCellAction.KIND,
            rowId,
            columnId,
            value
        };
    }

    export function isThisAction(action: Action): action is UpdateCellAction {
        return action.kind === UpdateCellAction.KIND;
    }
}

/** Resets the table to the headers. */
export interface ResetTableAction extends Action {
    kind: typeof ResetTableAction.KIND;
}


export namespace ResetTableAction {
    export const KIND = "resetTable";

    export function create(): ResetTableAction {
        return {
            kind: ResetTableAction.KIND
        };
    }

    export function isThisAction(action: Action): action is ResetTableAction {
        return action.kind === ResetTableAction.KIND;
    }
}

/** Sends the Id of the selected row to the client */
export interface SelectedRowAction extends Action {
    kind: typeof SelectedRowAction.KIND;
    rowId: string;
}


export namespace SelectedRowAction {
    export const KIND = "selectRow";

    export function create(rowId: string): SelectedRowAction {
        return {
            kind: KIND,
            rowId: rowId
        };
    }

    export function isThisAction(action: Action): action is SelectedRowAction {
        return action.kind === SelectedRowAction.KIND;
    }
}

/** Adds the mouselistener for selecting a row in the table */
export interface AddRowListenerAction extends Action {
    kind: typeof AddRowListenerAction.KIND;
}

export namespace AddRowListenerAction {
    export const KIND = "addRowListener";

    export function create(): AddRowListenerAction {
        return {
            kind: KIND
        };
    }

    export function isThisAction(action: Action): action is AddRowListenerAction {
        return action.kind === AddRowListenerAction.KIND;
    }
}