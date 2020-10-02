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
import { getLayerOfNode, getLayers } from './constraint-utils';
import { determineCons } from './relativeConstraint-utils';
import { renderDirArrow } from '../interactive-view-objects';
import { renderPositions } from './layered-interactive-view';


const verticalArrowXOffset = -2.5
const verticalArrowYOffset = -5
const horizontalArrowXOffset = -0.3
const horizontalArrowYOffset = -0.7

/**
 * Highlights the moved and target node & visualize the constraint that will be set.
 * @param root Root node of the graph
 * @param selNode selected node
 */
export function renderRelCons(root: KNode, selNode: KNode): VNode {
    const nodes = filterKNodes(root.children)
    const direction = nodes[0].direction
    const layers = getLayers(nodes, direction)

    let result = undefined
    let cons = determineCons(nodes, layers, selNode)

    // relative constraint icon is shown left above the node
    const x = 0
    const y = 0
    const constraintOffset = 5

    switch (cons.relCons) {
        // must be shown at a place that doesnt cause overlap with the visualization of set constraints
        case RelCons.IN_LAYER_SUCC_OF:
            result = renderILSuccOf(x - constraintOffset, y - constraintOffset, direction, "indianred")
            // highlight nodes
            cons.target.highlight = true
            cons.node.highlight = true
            break;
        case RelCons.IN_LAYER_PRED_OF:
            result = renderILPredOf(x - constraintOffset, y - constraintOffset, direction, "indianred")
            // highlight nodes
            cons.target.highlight = true
            cons.node.highlight = true
            break;
    }

    // @ts-ignore
    return <g>{result}</g>
}

/**
 * Renders an arrow indicating the in-layer-successor-of constraint
 * @param x
 * @param y
 * @param direction layout direction of the graph
 */
function renderILSuccOf(x: number, y: number, direction: Direction, color: string): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    const dir = vertical ? Direction.LEFT : Direction.UP
    // @ts-ignore
    return <g>
        {renderDirArrow(x + xOffset, y + yOffset, dir, color)}
    </g>
}

/**
 * Renders an arrow indicating the in-layer-predecessor-of constraint
 * @param x
 * @param y
 * @param direction layout direction of the graph
 */
function renderILPredOf(x: number, y: number, direction: Direction, color: string): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    const dir = vertical ? Direction.RIGHT : Direction.DOWN
    // @ts-ignore
    return <g>
        {renderDirArrow(x + xOffset, y + yOffset, dir, color)}
    </g>
}

/**
 * Render something to indicate the constraint set on a node.
 * @param node Node with a constraint
 */
export function renderSetRelConstraint(node: KNode) {
    let result = <g></g>
    const iLPConstraint = node.properties.iLPredOfConstraint
    const iLSConstraint = node.properties.iLSuccOfConstraint

    // relative constraint icon is shown to the right of the node
    const x = node.size.width
    const y = 0
    const constraintOffset = 2

    if (iLPConstraint != null && iLSConstraint != null) {
        // both rel cons are set
        result = <g>{renderILPredOf(x + constraintOffset, y + 2 * constraintOffset, node.direction, "grey")}
                    {renderILSuccOf(x + constraintOffset, y + constraintOffset, node.direction, "grey")}</g>
    } else if (iLPConstraint != null) {
        // predecessor cons is set
        result = <g>{renderILPredOf(x + constraintOffset, y + constraintOffset, node.direction, "grey")}</g>
    } else if (iLSConstraint != null) {
        // successor cons is set
        result = <g>{renderILSuccOf(x + constraintOffset, y + constraintOffset, node.direction, "grey")}</g>
    }
    // @ts-ignore
    return result
}


/**
 * Creates circles that indicate the available positions.
 * The position the node would be set to if it released is indicated by a filled circle.
 * @param nodes All nodes of the graph.
 * @param selNode Node that is currently selected.
 */
export function renderPosIndicators(nodes: KNode[], selNode: KNode): VNode {
    const direction = selNode.direction
    const layers = getLayers(nodes, direction)
    const current = getLayerOfNode(selNode, nodes, layers, direction)
    return renderPositions(current, nodes, layers, true, direction, true)
}