import { isUndefined } from "@theia/plugin-ext/lib/common/types"
import { Action, SModelElement } from "sprotty"
import { RefreshDiagramAction } from "../actions"
import { Direction, KNode, RelConsData, RelCons } from "../constraint-classes"
import { SetILPredOfConstraintAction, SetILSuccOfConstraintAction } from "./actions"
import { Layer } from "./constraint-types"
import { getLayerOfNode, getNodesOfLayer, getPositionInLayer } from "./constraint-utils"

/**
 * Sets properties of the target accordingly to the position the target is moved to
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
    let predX = 0
    if (!isUndefined(pred)) {
        if (pred.id === targetNode.id) {
            predY = targetNode.shadowY
            predX = targetNode.shadowX
        } else {
            predY = pred.position.y
            predX = pred.position.x
        }
    }
    let succY = 0
    let succX = 0
    if (!isUndefined(succ)) {
        if (succ.id === targetNode.id) {
            succY = targetNode.shadowY
            succX = targetNode.shadowX
        } else {
            succY = succ.position.y
            succX = succ.position.x
        }
    }

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            if (isUndefined(succ) || (!isUndefined(pred) && midY - predY - pred.size.height < succY - midY)) {
                // distance between current node and predecessor is lower
                if (pred.id !== targetNode.id && midX < predX + pred.size.width && midX > predX) {
                    // no constraint should be set if the moved node is in range of its original position & moved node must be in certain x range
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== targetNode.id) {
                if (midX < succX + succ.size.width && midX > succX) {
                    // moved node must be in certain x range
                    iLPredOf = true
                }
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            if (isUndefined(succ) || (!isUndefined(pred) && midX - pred.position.x - pred.size.width < succ.position.x - midX)) {
                // distance between current node and predecessor is lower
                if (pred.id !== targetNode.id && midY < pred.position.y + pred.size.height && midY > pred.position.y) {
                    // no constraint should be set if the moved node is in range of its original position & moved node must be in certain x range
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== targetNode.id) {
                if (midY < succ.position.y + succ.size.height && midY > succ.position.y) {
                    // moved node must be in certain y range
                    iLPredOf = true
                }
            }
            break;
        }
    }

    if (iLSuccOf) {
        return {relCons: RelCons.IN_LAYER_SUCC_OF, node: pred, target: targetNode}
    } else if (iLPredOf) {
        return {relCons: RelCons.IN_LAYER_PRED_OF, node: succ, target: targetNode}
    } else {
        return {relCons: RelCons.UNDEFINED, node: targetNode, target: targetNode}
    }
}