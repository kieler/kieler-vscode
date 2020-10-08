import { isUndefined } from "@theia/plugin-ext/lib/common/types"
import { Action, SModelElement } from "sprotty"
import { RefreshDiagramAction } from "../actions"
import { Direction, KNode, RelConsData, RelCons, KEdge } from "../constraint-classes"
import { SetILPredOfConstraintAction, SetILSuccOfConstraintAction } from "./actions"
import { Layer } from "./constraint-types"
import { getLayerOfNode, getNodesOfLayer, getPositionInLayer } from "./constraint-utils"

/**
 * Sets properties of the target accordingly to the position the target is moved to
 * @param nodes All nodes of the graph
 * @param layers Layers of the graph
 * @param target SModelElement that is moved
 */
export function setRelativeConstraint(nodes: KNode[], layers: Layer[], target: SModelElement): Action {
    let cons = determineCons(nodes, layers, target)

    switch (cons.relCons) {
        case RelCons.IN_LAYER_SUCC_OF:
            return new SetILSuccOfConstraintAction({
                id: cons.target.id,
                otherNode: cons.node.id
            })
        case RelCons.IN_LAYER_PRED_OF:
            return new SetILPredOfConstraintAction({
                id: cons.target.id,
                otherNode: cons.node.id
            })
        default:
            // If the node was moved without setting a constraint - let it snap back
            return new RefreshDiagramAction()
    }

}

/**
 * Determines the relative constraint that would be set and the target of the constraint.
 * @param nodes All nodes of the graph
 * @param layers Layer of the graph
 * @param target Node that is moved
 */
export function determineCons(nodes: KNode[], layers: Layer[], target: SModelElement): RelConsData {
    const targetNode: KNode = target as KNode
    const direction = targetNode.direction

    // calculate layer and position the target has in the graph at the new position
    const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
    const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
    const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)

    let pred = nodesOfLayer[positionOfTarget - 1]
    let succ = nodesOfLayer[positionOfTarget]
    if (!isUndefined(succ) && succ.id === targetNode.id) {
        // node should not be its own successor
        succ = nodesOfLayer[positionOfTarget + 1]
    }

    // if node is in its original layer, it can be its own pred or succ
    if (positionOfTarget === targetNode.properties.positionId && layerOfTarget === targetNode.properties.layerId) {
        switch (direction) {
            case Direction.UNDEFINED:
            case Direction.LEFT:
            case Direction.RIGHT: {
                if (targetNode.position.y > targetNode.shadowY) {
                    pred = targetNode
                } else {
                    succ = targetNode
                }
                break;
            }
            case Direction.UP:
            case Direction.DOWN: {
                if (targetNode.position.x > targetNode.shadowX) {
                    pred = targetNode
                } else {
                    succ = targetNode
                }
                break;
            }
        }
    }


    let iLPredOf = false
    let iLSuccOf = false
    let midY = targetNode.position.y + 0.5 * targetNode.size.height
    let midX = targetNode.position.x + 0.5 * targetNode.size.width

    // coordinates for the case the node is its own pred/succ
    let predY = 0
    if (!isUndefined(pred)) {
        if (pred.id === targetNode.id) {
            predY = targetNode.shadowY
        } else {
            predY = pred.position.y
        }
    }
    let succY = 0
    if (!isUndefined(succ)) {
        if (succ.id === targetNode.id) {
            succY = targetNode.shadowY
        } else {
            succY = succ.position.y
        }
    }

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            if (isUndefined(succ) || (!isUndefined(pred) && midY - predY - pred.size.height < succY - midY)) {
                // distance between current node and predecessor is lower
                if (!isUndefined(pred) && pred.id !== targetNode.id) {
                    // no constraint should be set if the moved node is in range of its original position
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== targetNode.id) {
                // moved node must be in certain x range
                iLPredOf = true
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            if (isUndefined(succ) || (!isUndefined(pred) && midX - pred.position.x - pred.size.width < succ.position.x - midX)) {
                // distance between current node and predecessor is lower
                if (!isUndefined(pred) && pred.id !== targetNode.id) {
                    // no constraint should be set if the moved node is in range of its original position
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== targetNode.id) {
                // moved node must be in certain y range
                iLPredOf = true
            }
            break;
        }
    }

    if (iLSuccOf) {
        if (!forbiddenRC(targetNode, pred)) {
            return {relCons: RelCons.IN_LAYER_SUCC_OF, node: pred, target: targetNode}
        }
    } else if (iLPredOf) {
        if (!forbiddenRC(targetNode, succ)) {
            return {relCons: RelCons.IN_LAYER_PRED_OF, node: succ, target: targetNode}
        }
    }

    return {relCons: RelCons.UNDEFINED, node: targetNode, target: targetNode}
}

/**
 * Determines the nodes that are connected to {@code node} by relative constraints.
 * The nodes are not sorted.
 * @param node One node of the chain
 * @param layerNodes Nodes that are in the same layer as {@code node}
 */
export function getChain(node: KNode, layerNodes: KNode[]) {
    const pos = layerNodes.indexOf(node)
    let chainNodes: KNode[] = []
    chainNodes[0] = node
    // from node to the start
    for (let i = pos - 1; i >= 0; i--) {
        if (layerNodes[i].properties.iLPredOfConstraint != null || layerNodes[i + 1].properties.iLSuccOfConstraint != null) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = -1
        }
    }
    // from node to the end
    for (let i = pos + 1; i < layerNodes.length; i++) {
        if (layerNodes[i].properties.iLSuccOfConstraint != null || layerNodes[i - 1].properties.iLPredOfConstraint != null) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = layerNodes.length
        }
    }

    return chainNodes
}

/**
 * Determines whether a rel cons can be set between {@code node1} and {@code node2}
 * @param node1 One of the nodes
 * @param node2 The other one of the nodes
 */
export function forbiddenRC(node1: KNode, node2: KNode) {
    let connectedNodes: KNode[] = []
    let edges = node1.outgoingEdges as any as KEdge[]
    for (let edge of edges) {
        connectedNodes[connectedNodes.length] = edge.target as KNode
    }
    edges = node1.incomingEdges as any as KEdge[]
    for (let edge of edges) {
        connectedNodes[connectedNodes.length] = edge.source as KNode
    }

    // check whether the other node is connnected to the first one
    for (let node of connectedNodes) {
        if (node.id === node2.id) {
            // rel cons are forbidden for the given nodes
            return true
        }
    }

    // rel cons are valid for the given nodes
    return false
}