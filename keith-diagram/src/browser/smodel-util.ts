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

import { SModelElementSchema, SModelRootSchema } from "sprotty";

/**
 * Utility function to insert an SModelElement into an existing model.
 * The id of the new piece must already be known by the model. That is to
 * say, there is already a placeholder element with the same id in the model.
 * @param modelRoot 
 * @param modelElement 
 */
export function insertSModelElementIntoModel(modelRoot: SModelRootSchema, modelElement: SModelElementSchema){
    // traverse model and search for insertion point
    replaceNodeById(modelRoot, modelElement);
    // TODO: refactor this into one function not two
}

function replaceNodeById(root: SModelElementSchema, modelElement: SModelElementSchema) {
    let id = modelElement.id
    if (root.children === undefined) {
        return;
    }
    // try to find element in current children
    let index = root.children.findIndex(child => {
        return child.id === id
    });

    if (index > -1) {
        // replace if it exists
        root.children[index] = modelElement
    } else {
        // recurse further down otherwise
        root.children.forEach(childNode => {
            replaceNodeById(childNode, modelElement);
        });
    }
}