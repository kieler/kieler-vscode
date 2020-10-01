/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import { Direction, KNode, RelCons } from '../constraint-classes';
import { filterKNodes } from '../helper-methods';
import { getLayers } from './constraint-utils';
import { determineCons } from './relativeConstraint-utils';
import { renderDirArrow } from '../interactive-view-objects';

/**
 * Highlights the moved and target node visualize the constraint that will be set.
 * @param root Root node of the graph
 * @param selNode selected node
 */
export function renderRelCons(root: KNode, selNode: KNode): VNode {
    const nodes = filterKNodes(root.children)
    const direction = nodes[0].direction
    const layers = getLayers(nodes, direction)

    let result = undefined
    let cons = determineCons(nodes, layers, selNode)

    let x = selNode.size.width
    let y = 0
    const constraintOffset = 2
    switch (cons.relCons) {
        case RelCons.IN_LAYER_SUCC_OF:
            result = renderILSuccOf(x + constraintOffset, y - constraintOffset, direction)
            // highlight nodes
            cons.target.highlight = true
            cons.node.highlight = true
            break;
        case RelCons.IN_LAYER_PRED_OF:
            result = renderILPredOf(x + constraintOffset, y - constraintOffset, direction)
            // highlight nodes
            cons.target.highlight = true
            cons.node.highlight = true
            break;
    }

    // @ts-ignore
    return <g>{result}</g>
}

const verticalArrowXOffset = -2.5
const verticalArrowYOffset = -5
const horizontalArrowXOffset = -0.3
const horizontalArrowYOffset = -0.7

/**
 * Renders an arrow indicating the in-layer-successor-of constraint
 * @param x
 * @param y
 * @param direction layout direction of the graph
 */
function renderILSuccOf(x: number, y: number, direction: Direction): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    const dir = vertical ? Direction.LEFT : Direction.UP
    // @ts-ignore
    return <g>
        {renderDirArrow(x + xOffset, y + yOffset, dir, "red")}
    </g>
}

/**
 * Renders an arrow indicating the in-layer-predecessor-of constraint
 * @param x
 * @param y
 * @param direction layout direction of the graph
 */
function renderILPredOf(x: number, y: number, direction: Direction): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    const dir = vertical ? Direction.RIGHT : Direction.DOWN
    // @ts-ignore
    return <g>
        {renderDirArrow(x + xOffset, y + yOffset, dir, "red")}
    </g>
}
