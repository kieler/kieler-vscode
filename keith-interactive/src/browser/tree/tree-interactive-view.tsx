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
/** @jsx svg */
import { svg } from 'snabbdom-jsx';
import { KNode, Direction, KEdge } from '../constraint-classes';
import { renderCircle } from '../interactive-view-objects';
import { getSiblings, getDirectionVector, dotProduct, getOriginalNodePositionX, getOriginalNodePositionY } from './constraint-util';

const boundingBoxMargin = 5

 /**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 */
export function renderHierarchyLevel(nodes: KNode[], root: KNode) {
    const direction = nodes[0].direction
    let result = <g></g>

    // Draw rect around all nodes
    let color = 'grey'
    let minX: number = Number.MAX_VALUE
    let minY: number = Number.MAX_VALUE
    let maxX: number = Number.MIN_VALUE
    let maxY: number = Number.MIN_VALUE
    nodes.forEach(node => {
        if (node.position.x < minX) {
            minX = node.position.x
        }
        if (node.position.y < minY) {
            minY = node.position.y
        }
        if (node.position.x + node.size.width > maxX) {
            maxX = node.position.x + node.size.width
        }
        if (node.position.y + node.size.height > maxY) {
            maxY = node.position.y + node.size.height
        }
    })
    result = <g>{result}<rect
        x={minX - boundingBoxMargin}
        y={minY - boundingBoxMargin}
        width={maxX - minX + 2 * boundingBoxMargin}
        height={maxY - minY + 2 * boundingBoxMargin}
        stroke={color}
        fill= 'rgba(0,0,0,0)'
        strokeWidth={2 * boundingBoxMargin}
        style={{ 'stroke-dasharray': 4 } as React.CSSProperties}>
    </rect></g>

    // Render Valid locations
    let selectedNode = nodes.find(x => x.selected)
    let selectedKNode = selectedNode as KNode
    if (selectedNode) {
        let selectedSiblings = getSiblings(nodes, selectedNode);
        let highlightedIndex, circleCoord, approxNodeSpacing = 999999

        if (direction === Direction.LEFT || direction === Direction.RIGHT) {
            selectedSiblings.sort((x, y) => getOriginalNodePositionY(x) - getOriginalNodePositionY(y));
            highlightedIndex = selectedSiblings.findIndex(x => getOriginalNodePositionY(x) + x.size.height / 2
                >= selectedKNode.position.y + selectedKNode.size.height / 2);
            circleCoord = getOriginalNodePositionX(selectedNode) + selectedNode.size.width / 2
        } else {
            selectedSiblings.sort((x, y) => getOriginalNodePositionX(x) - getOriginalNodePositionX(y));
            highlightedIndex = selectedSiblings.findIndex(x => getOriginalNodePositionX(x) + x.size.width / 2
                >= selectedKNode.position.x + selectedKNode.size.width / 2);
            circleCoord = getOriginalNodePositionY(selectedNode) + selectedNode.size.height / 2
        }

        for (let i = 0; i < selectedSiblings.length - 1; i++) {
            let dist
            if (direction === Direction.LEFT || direction === Direction.RIGHT)
                dist = getOriginalNodePositionY(selectedSiblings[i + 1]) 
                    - getOriginalNodePositionY(selectedSiblings[i]) - selectedSiblings[i].size.height
            else 
                dist = getOriginalNodePositionX(selectedSiblings[i + 1]) 
                    - getOriginalNodePositionX(selectedSiblings[i]) - selectedSiblings[i].size.width

            if (approxNodeSpacing > dist)
                approxNodeSpacing = dist
        }

        for (let i = 0; i < selectedSiblings.length - 1; i++) {
            let x1, y1, x2, y2;
            if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                x1 = getOriginalNodePositionX(selectedSiblings[i]) + selectedSiblings[i].size.width / 2;
                y1 = getOriginalNodePositionY(selectedSiblings[i]) + selectedSiblings[i].size.height;
                x2 = getOriginalNodePositionX(selectedSiblings[i + 1]) + selectedSiblings[i + 1].size.width / 2;
                y2 = getOriginalNodePositionY(selectedSiblings[i + 1]);
            } else {
                x1 = getOriginalNodePositionX(selectedSiblings[i]) + selectedSiblings[i].size.width;
                y1 = getOriginalNodePositionY(selectedSiblings[i]) + selectedSiblings[i].size.height / 2;
                x2 = getOriginalNodePositionX(selectedSiblings[i + 1]);
                y2 = getOriginalNodePositionY(selectedSiblings[i + 1]) + selectedSiblings[i + 1].size.height / 2;
            }

            // Get middle coords between current and next sibling
            let middleX, middleY
            if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                middleX = circleCoord
                middleY = (y1 + y2) / 2
            } else {
                middleX = (x1 + x2) / 2
                middleY = circleCoord
            }

            // Start point
            if (i === 0 && selectedSiblings[i].id !== selectedNode.id) {
                let x, y

                if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                    x = circleCoord
                    y = y1 - selectedSiblings[i].size.height - approxNodeSpacing / 2
                } else {
                    x = x1 - selectedSiblings[i].size.width - approxNodeSpacing / 2
                    y = circleCoord
                }

                result = <g>{result}{renderCircle(i === highlightedIndex, x, y, false)}</g>;
            }

            // Intermediate points
            if (selectedSiblings[i].id !== selectedNode.id && 
                selectedSiblings[i + 1].id !== selectedNode.id)
                result = <g>{result}{renderCircle(i === highlightedIndex - 1, middleX, middleY, false)}</g>;

            // End point
            if (i === selectedSiblings.length - 2 && selectedSiblings[i + 1].id !== selectedNode.id) {
                let x, y;

                if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                    x = circleCoord
                    y = y2 + selectedSiblings[i + 1].size.height + approxNodeSpacing / 2
                } else {
                    x = x2 + selectedSiblings[i + 1].size.width + approxNodeSpacing / 2
                    y = circleCoord
                }

                result = <g>{result}{renderCircle(highlightedIndex === -1, x, y, false)}</g>;
            }
        }
    }

    return result
}

/**
 * Mark edges that make the graph cyclic
 */
export function markCycleInducingEdges(nodes: KNode[]) {
    const dirVec = getDirectionVector(nodes[0])
    nodes.forEach(n => {
        n.outgoingEdges.forEach(e => {
            (e as KEdge).cycleInducing = e.target !== undefined && e.source !== undefined &&
                dotProduct(dirVec, [e.target.position.x - e.source.position.x, e.target.position.y - e.source.position.y]) <= 0;
        })
    })
}

/**
 * Renders a lock inside the node.
 * @param node The node with the constraint set.
 */
export function renderTreeConstraint(node: KNode) {
    return <g></g>
}