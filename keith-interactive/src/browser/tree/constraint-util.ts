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
import { KNode, KEdge, Direction } from '../constraint-classes';
import { TreeSetPositionConstraintAction } from './actions';

export function dotProduct(vec1: [number, number], vec2: [number, number]): number {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1]
}

export function getDirectionVector(node: KNode): [number, number] {
    const direction = node.direction
    if (!direction || direction === Direction.DOWN)
        return [0, 1]
    else if (direction === Direction.LEFT)
        return [-1, 0]
    else if (direction === Direction.RIGHT)
        return [1, 0]
    else if (direction === Direction.UP)
        return [0, -1]
    else
        return [0, 1]
}

export function getRoot(nodes: KNode[]): KNode[] {
    const re: KNode[] = [];
    nodes.forEach(x => {
        if ((x.incomingEdges as any as KEdge[]).length === 0 || x.position.y === 40)
            re.push(x);
    })
    return re;
}

export function rootDistance(n: KNode, root: KNode): number {
    if (root.id === n.id) return 0;
    const edges: KEdge[] = n.incomingEdges as any as KEdge[];
    if (edges.length === 0) return 0;
    const p: KNode = edges[0].source as KNode;
    return rootDistance(p, root) + 1;
}

export function getChildren(n: KNode): KNode[] {
    const re: KNode[] = [];
    (n.outgoingEdges as any as KEdge[]).forEach(x => {
        re.push(x.target as KNode);
    });
    return re;
}

export function getLevels(nodes: KNode[]): KNode[][] {
    const re: KNode[][] = [getRoot(nodes)];
    nodes.forEach(x => x.properties.treeLevel = -1);

    let newNode = true;
    let curLevel: KNode[] = [];
    re[0].forEach(x => {
        curLevel.push(x);
        x.properties.treeLevel = 0;
    });
    re[0].forEach(x => x.properties.treeLevel = 0)
    for (let i = 1; newNode; i++) {
        newNode = false;
        curLevel = curLevel.map(x => getChildren(x)).reduce((x, y) => x.concat(y), []);
        re[i] = [];
        curLevel.forEach(x => {
            if (x.properties.treeLevel === -1) {
                newNode = true;
            }
            if (x.properties.treeLevel !== 0) {
                x.properties.treeLevel = i;
            }
            re[i].push(x);
        });
    }

    return re;
}

export function getSiblings(nodes: KNode[], targetNode: KNode): KNode[] {
    const incomers = targetNode.incomingEdges as KEdge[];
    if (incomers.length === 0)
        return [];
    const toParent = incomers.find(x => (x.source as KNode).properties.treeLevel === targetNode.properties.treeLevel - 1);
    if (toParent === undefined)
        return [];
    // const parent = toParent.source;
    const targetPosX = getOriginalNodePositionX(targetNode);
    const targetPosY = getOriginalNodePositionY(targetNode);

    const siblings: KNode[] = [];
    nodes.forEach(x => {
        (x.incomingEdges as any as KEdge[]).forEach(y => {
            const xPosX = getOriginalNodePositionX(x);
            const xPosY = getOriginalNodePositionY(x);
            if (nodes[0].direction === Direction.LEFT || nodes[0].direction === Direction.RIGHT) {
                if (incomers.some(x => x.source === y.source) && xPosX + 15 > targetPosX && xPosX - 15 < targetPosX)
                    siblings.push(x);
            } else {
                if (incomers.some(x => x.source === y.source) && xPosY + 15 > targetPosY && xPosY - 15 < targetPosY)
                    siblings.push(x);
            }
        });
    });
    return siblings;
}

export function getOriginalNodePositionX(node: KNode) {
    return (node.shadow ? node.shadowX : node.position.x);
}
export function getOriginalNodePositionY(node: KNode) {
    return (node.shadow ? node.shadowY : node.position.y);
}

export function setTreeProperties(nodes: KNode[], data: Map<string, any>, event: MouseEvent, target: SModelElement) {
    const targetNode: KNode = target as KNode;
    const direction = nodes[0].direction
    // const siblings = nodes.filter(x => (x.incomingEdges as any as KEdge[])[0].source?.id == parent?.id);  Das mag der yarn watcher irgendwie nicht :C
    const siblings: KNode[] = getSiblings(nodes, targetNode);
    if (direction === Direction.LEFT || direction === Direction.RIGHT)
        siblings.sort((x, y) => x.position.y - y.position.y);
    else
        siblings.sort((x, y) => x.position.x - y.position.x);

    if (siblings.length === 0)
        return new RefreshDiagramAction();

    const positionOfTarget = siblings.indexOf(targetNode);
    if (targetNode.properties.positionId !== positionOfTarget) {
        // set the position Constraint
        return new TreeSetPositionConstraintAction({
            id: targetNode.id,
            position: positionOfTarget,
            posCons: positionOfTarget
        })
    }

    return new RefreshDiagramAction()
}