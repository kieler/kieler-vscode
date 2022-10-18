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

import { SelectedRowAction } from "./actions";

let lastSelected: HTMLElement;

/**
 * Determines the Id of the row that is clicked on.
 * @param event The mousevent.
 * @returns Id of the selected row or undefined if none is selected.
 */
export function rowSelection(event: MouseEvent) {
    const node = event.target;
    const owner = (node as HTMLElement).parentElement;
    if (owner) {
        if (lastSelected) {
            lastSelected.classList.remove("focused");
        }
        lastSelected = owner;
        owner.classList.add("focused");
        return SelectedRowAction.create(owner.id);
    }
    return undefined;
}