import { DeleteRelativeConstraintsAction, DeleteStaticConstraintAction } from "@kieler/keith-interactive/lib/layered/actions";
import { SKNode } from "@kieler/keith-sprotty/lib/skgraph-models";
import { injectable } from "inversify"
import { IContextMenuItemProvider, isSelected, MenuItem, Point, SModelRoot } from "sprotty";

@injectable()
export class KeithContextMenuItemProvider implements IContextMenuItemProvider {

    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected));
        for (const element of selectedElements) {
            if (element instanceof SKNode) {
                return Promise.resolve([this.deletionItem(element)])
            }
        }
        return Promise.resolve([]);
    }

    private deletionItem(node: SKNode): MenuItem {
        return {
            id: "delete",
            label: "Delete",
            sortString: "d",
            group: "delete",
            actions: [],
            children: [this.delRelConsItem(node), this.delAbsConsItem(node), this.delAllConsItem(node)]
        }
    }

    private delRelConsItem(node: SKNode): MenuItem {
        return {
            id: "delete_rel_cons",
            label: "Delete relative constraints",
            sortString: "3",
            group: "delete",
            actions: [new DeleteRelativeConstraintsAction({id: node.id})],
            isEnabled: () => (node.properties.iLPredOfConstraint !== undefined || node.properties.iLSuccOfConstraint !== undefined),
            isToggled: () => false,
            isVisible: () => true
        }
    }

    private delAbsConsItem(node: SKNode): MenuItem {
        return {
            id: "delete_abs_cons",
            label: "Delete absolute constraints",
            sortString: "2",
            group: "delete",
            actions: [new DeleteStaticConstraintAction({id: node.id})],
            isEnabled: () => (node.properties.positionConstraint !== -1 || node.properties.layerConstraint !== -1),
            isToggled: () => false,
            isVisible: () => true
        }
    }

    private delAllConsItem(node: SKNode): MenuItem {
        return {
            id: "delete_all_cons",
            label: "Delete all constraints",
            sortString: "1",
            group: "delete",
            actions: [new DeleteStaticConstraintAction({id: node.id}), new DeleteRelativeConstraintsAction({id: node.id})],
            isEnabled: () => (node.properties.positionConstraint !== -1 || node.properties.layerConstraint !== -1
                || node.properties.iLPredOfConstraint !== undefined || node.properties.iLSuccOfConstraint !== undefined),
            isToggled: () => false,
            isVisible: () => true
        }
    }

}