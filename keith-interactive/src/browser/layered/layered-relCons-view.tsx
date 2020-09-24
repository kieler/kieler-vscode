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
import { getSelectedNode } from '../helper-methods';
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