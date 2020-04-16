/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import {
    Action
} from 'sprotty/lib';
import { AspectRatio, TreeDeletePositionConstraint, TreeSetPositionConstraint } from './constraint-types';

/**
 * Send from client to server to set the aspect ratio.
 */
export class SetAspectRatioAction implements Action {
    static readonly KIND: string = 'setAspectRatio'
    readonly kind = SetAspectRatioAction.KIND

    constructor(public readonly constraint: AspectRatio) {
    }
}

/**
 * Send from client to server to delete an position constraint on a node.
 */
export class TreeDeletePositionConstraintAction implements Action {
    static readonly KIND: string = 'treeDeletePositionConstraint'
    readonly kind = TreeDeletePositionConstraintAction.KIND

    constructor(public readonly constraint: TreeDeletePositionConstraint) {
    }
}

/**
 * Send from client to server to set a position to force a node on a specific position.
 */
export class TreeSetPositionConstraintAction implements Action {
    static readonly KIND: string = 'treeSetPositionConstraint'
    readonly kind = TreeSetPositionConstraintAction.KIND

    constructor(public readonly constraint: TreeSetPositionConstraint) {
    }
}