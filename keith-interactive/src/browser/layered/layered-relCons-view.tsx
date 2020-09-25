import { isUndefined } from '@theia/plugin-ext/lib/common/types';
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
// import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import { KNode } from '../constraint-classes';
import { filterKNodes, getSelectedNode } from '../helper-methods';
import { getLayerOfNode, getLayers, getNodesOfLayer, getPositionInLayer } from './constraint-utils';
import { determineCons } from './relativeConstraint-utils';

export function renderRelCons(nodes: KNode[], root: KNode): VNode {
    const direction = nodes[0].direction
    let selNode = getSelectedNode(nodes)

    // let result: JSX.Element = <g></g>

    if (!isUndefined(selNode)) {
        // calculate layer and position the target has in the graph at the new position
        const layers = getLayers(nodes, direction)
        const layerOfTarget = getLayerOfNode(selNode, nodes, layers, direction)
        const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
        const positionOfTarget = getPositionInLayer(nodesOfLayer, selNode, direction)

        const predNode = nodesOfLayer[positionOfTarget - 1]
        const succNode = nodesOfLayer[positionOfTarget]

        let cons = determineCons(selNode, predNode, succNode, direction)

        switch (cons) {
            case -1:
                // result = <g>{result}{renderSuccOf()}</g>
                break;
            case 1:
                break;
        }
    }
    // @ts-ignore
    return <g></g>
}


export function renderSuccOf(): VNode {
    // @ts-ignore
    return <g></g>
}

export function renderPredOf(): VNode {
    // @ts-ignore
    return <g></g>
}

export function highlightNodes(root: KNode) {
    let nodes = filterKNodes(root.children)
    const direction = nodes[0].direction
    let layers = getLayers(nodes, direction)
    const targetNode = getSelectedNode(nodes)

    if (!isUndefined(targetNode)) {
        // calculate layer and position the target has in the graph at the new position
        const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
        const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
        const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)

        const predNode = nodesOfLayer[positionOfTarget - 1]
        let succNode = nodesOfLayer[positionOfTarget]
        if (!isUndefined(succNode) && succNode.id === targetNode.id && positionOfTarget !== targetNode.properties.positionId) {
            // if targets original position is in this layer it should not be its own successor unless it is its original position
            succNode = nodesOfLayer[positionOfTarget + 1]
        }

        let cons = determineCons(targetNode, predNode, succNode, direction)

        // TODO: replace number with enum
        switch (cons) {
            case -1:
                targetNode.highlight = true
                predNode.highlight = true
                break;
            case 1:
                targetNode.highlight = true
                succNode.highlight = true
                break;
        }
    }
}