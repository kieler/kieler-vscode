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

import { Direction } from "../constraint-classes"

 /**
 * A tree level visualization data class for the interactive tree approach.
 */
export class Level {
    begin: number
    end: number
    mid: number
    /**
     * Where up is, is determined by the direction
     */
    topBorder: number

    /**
     * Where low is, is determined by the direction
     */
    bottomBorder: number
    /**
     * 0: UNDEFINED, 1: RIGHT, 2: LEFT, 3: DOWN, 4: UP
     */
    direction: Direction

    constructor(leftX: number, rightX: number, mid: number, direction: Direction) {
        this.begin = leftX
        this.end = rightX
        this.mid = mid
        this.direction = direction
    }

}

/**
 * A deletion constraint data class.
 */
export class TreeDeletePositionConstraint {
    id: string
}

/**
 * A set position constraint data class.
 */
export class TreeSetPositionConstraint {
    id: string
    position: number
}
