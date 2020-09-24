import { isUndefined } from "@theia/plugin-ext/lib/common/types"
import { Action, SModelElement } from "sprotty"
import { RefreshDiagramAction } from "../actions"
import { Direction, KNode } from "../constraint-classes"
import { SetILPredOfConstraintAction, SetILSuccOfConstraintAction } from "./actions"
import { Layer } from "./constraint-types"
import { getLayerOfNode, getNodesOfLayer, getPositionInLayer } from "./constraint-utils"

/**
 * Sets properties of the target accordingly to the position the target is moved to
 * @param target SModelElement that is moved
 */
export function setRelativeConstraint(nodes: KNode[], layers: Layer[], target: SModelElement): Action {
    const targetNode: KNode = target as KNode
    const direction = targetNode.direction

    // calculate layer and position the target has in the graph at the new position
    const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
    const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
    const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)

    const predNode = nodesOfLayer[positionOfTarget - 1]
    let succNode = nodesOfLayer[positionOfTarget]
    if (succNode.id === targetNode.id && positionOfTarget !== targetNode.properties.positionId) {
        // if targets original position is in this layer it should not be its own successor unless it is its original position
        succNode = nodesOfLayer[positionOfTarget + 1]
    }

    let cons = determineCons(targetNode, predNode, succNode, direction)

    // TODO: replace number with enum
    switch (cons) {
        case -1:
            return new SetILSuccOfConstraintAction({
                id: targetNode.id,
                otherNode: predNode.id
            })
        case 1:
            return new SetILPredOfConstraintAction({
                id: targetNode.id,
                otherNode: succNode.id
            })
        default:
            // If the node was moved without setting a constraint - let it snap back
            return new RefreshDiagramAction()
    }

}


export function determineCons(target: KNode, pred: KNode, succ: KNode, direction: Direction) {
    let iLPredOf = false
    let iLSuccOf = false
    let midY = target.position.y + 0.5 * target.size.height
    let midX = target.position.x + 0.5 * target.size.width

    let predY = 0
    let predX = 0
    if (!isUndefined(pred)) {
        if (pred.id === target.id) {
            predY = target.shadowY
            predX = target.shadowX
        } else {
            predY = pred.position.y
            predX = pred.position.x
        }
    }

    let succY = 0
    let succX = 0
    if (!isUndefined(succ)) {
        if (succ.id === target.id) {
            succY = target.shadowY
            succX = target.shadowX
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
                if (pred.id !== target.id && midX < predX + pred.size.width && midX > predX) {
                    // no constraint should be set if the moved node is in range of its original position & moved node must be in certain x range
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== target.id) {
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
                if (pred.id !== target.id && midY < pred.position.y + pred.size.height && midY > pred.position.y) {
                    // no constraint should be set if the moved node is in range of its original position & moved node must be in certain x range
                    iLSuccOf = true
                }
            } else if (!isUndefined(succ) && succ.id !== target.id) {
                if (midY < succ.position.y + succ.size.height && midY > succ.position.y) {
                    // moved node must be in certain y range
                    iLPredOf = true
                }
            }
            break;
        }
    }

    if (iLSuccOf) {
        return -1
    } else if (iLPredOf) {
        return 1
    } else {
        return 0
    }
}