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

import { SModelElement } from 'sprotty';
import { RefreshDiagramAction } from '../actions';
import { KNode, KEdge } from '../constraint-classes';
import { TreeSetPositionConstraintAction } from './actions';

export function setTreeProperties(nodes: KNode[], data: Map<string, any>, event: MouseEvent, target: SModelElement) { 
    const targetNode: KNode = target as KNode;
    const incomers = targetNode.incomingEdges as any as KEdge[];
    if (incomers.length == 0)
        return new RefreshDiagramAction();
    const parent = incomers[0].source;

    //const siblings = nodes.filter(x => (x.incomingEdges as any as KEdge[])[0].source?.id == parent?.id);  Das mag der yarn watcher irgendwie nicht :C
    var siblings : KNode[] = [];
    nodes.forEach(x => {
        (x.incomingEdges as any as KEdge[]).forEach(y => {
            if (y.source === parent) {
                siblings.push(x);
            }
        });
    });
    siblings.sort((x,y) => x.position.x - y.position.x);

    const positionOfTarget = siblings.indexOf(targetNode);
    if (targetNode.properties.positionId !== positionOfTarget || true) {
        // set the position Constraint
        return new TreeSetPositionConstraintAction({
            id: targetNode.id,
            position: positionOfTarget
        })
    }

    return new RefreshDiagramAction()
}