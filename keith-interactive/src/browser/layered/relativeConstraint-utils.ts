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

    // TODO: catch indexoutofbound excp.
    const predNode = nodes[positionOfTarget - 1]
    const succNode = nodes[positionOfTarget + 1]

    let consValue: string = ""
    let iLPredOf = false
    let iLSuccOf = false
    let midY = targetNode.position.y + 0.5 * targetNode.size.height
    let midX = targetNode.position.x + 0.5 * targetNode.size.width

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            // TODO: bewegter Knoten sollte auch in gewisser x Reichweite sein
            if (midY - predNode.position.y + predNode.size.height < succNode.position.y - midY) {
                // distance between current node and predecessor is lower
                if (midX < predNode.position.x + predNode.size.width && midX > predNode.position.x) {
                    // moved node must be in certain x range
                    consValue = predNode.id
                    iLSuccOf = true
                }
            } else {
                if (midX < succNode.position.x + succNode.size.width && midX > succNode.position.x) {
                    // moved node must be in certain x range
                    consValue = succNode.id
                    iLPredOf = true
                }
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            // TODO: bewegter Knoten sollte auch in gewisser y Reichweite sein
            if (midX - predNode.position.x + predNode.size.width < succNode.position.x - midX) {
                // distance between current node and predecessor is lower
                if (midY < predNode.position.y + predNode.size.height && midY > predNode.position.y) {
                    // moved node must be in certain y range
                    consValue = predNode.id
                    iLSuccOf = true
                }
            } else {
                // distance between current node and predecessor is lower
                if (midY < succNode.position.y + succNode.size.height && midY > succNode.position.y) {
                    // moved node must be in certain y range
                    consValue = succNode.id
                    iLPredOf = true
                }
            }
            break;
        }
    }

    if (iLPredOf) {
        return new SetILPredOfConstraintAction({
            id: targetNode.id,
            otherNode: consValue
        })
    } else if (iLSuccOf) {
        return new SetILSuccOfConstraintAction({
            id: targetNode.id,
            otherNode: consValue
        })
    }

    // If the node was moved without setting a constraint - let it snap back
    return new RefreshDiagramAction()
}