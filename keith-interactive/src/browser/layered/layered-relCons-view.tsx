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
import { KNode, RelCons } from '../constraint-classes';
import { filterKNodes, getSelectedNode } from '../helper-methods';
import { getLayers } from './constraint-utils';
import { determineCons } from './relativeConstraint-utils';

export function renderRelCons(nodes: KNode[], root: KNode): VNode {
    const direction = nodes[0].direction
    let selNode = getSelectedNode(nodes)

    // let result: JSX.Element = <g></g>

    if (!isUndefined(selNode)) {
        const layers = getLayers(nodes, direction)

        let cons = determineCons(nodes, layers, selNode)

        switch (cons.relCons) {
            case RelCons.IN_LAYER_SUCC_OF:
                // result = <g>{result}{renderSuccOf()}</g>
                break;
            case RelCons.IN_LAYER_PRED_OF:
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

        let cons = determineCons(nodes, layers, targetNode)

        switch (cons.relCons) {
            case RelCons.IN_LAYER_SUCC_OF:
                cons.target.highlight = true
                cons.node.highlight = true
                break;
            case RelCons.IN_LAYER_PRED_OF:
                cons.target.highlight = true
                cons.node.highlight = true
                break;
        }
    }
}