/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
// import { RequestKeithPopupModelAction } from '@kieler/keith-sprotty/lib/hover/hover';
import { /* isSKGraphElement, */ SKGraphElement } from "@kieler/keith-sprotty/lib/skgraph-models";
import { findRendering } from '@kieler/keith-sprotty/lib/skgraph-utils';
import { CodeAction, Range } from '@theia/languages/lib/browser';
import { injectable, inject } from "inversify";
import { HtmlRootSchema, /* PreRenderedElementSchema, */ RequestPopupModelAction, SModelElementSchema, SModelRootSchema } from "sprotty";
import { CodeActionPalettePopupProvider, PaletteButtonSchema } from "sprotty-theia";
import { OwnCodeActionProvider } from "./OwnCodeActionProvider";

@injectable()
export class PopupModelProvider extends CodeActionPalettePopupProvider {

    @inject(OwnCodeActionProvider) codeActionProvider: OwnCodeActionProvider;

    async getPopupModel(request: RequestPopupModelAction, elementSchema: SModelRootSchema): Promise<SModelElementSchema | undefined> {
/*         if (elementSchema
            && request instanceof RequestKeithPopupModelAction
            && isSKGraphElement(request.parent)
            && request.element !== undefined) {
            const tooltip = this.findTooltip(request.parent, request.element.id)
            if (tooltip) {
                return <HtmlRootSchema> {
                    type: 'html',
                    id: 'popup',
                    children: [
                        <PreRenderedElementSchema> {
                            type: 'pre-rendered',
                            id: 'popup-body',
                            code: `<div>${tooltip}</div>`
                        }
                    ],
                    canvasBounds: request.bounds
                }
            }
        } */

        // TODO: range anhand von elementSchema bestimmen -> dann kann auch der CodeActionPalettePopupProvider direkt benutzt werden
        // TODO: statt popup lieber rechtsklick benutzen
        const range = <Range> {
            start: {
                line: 0,
                character: 0
            },
            end: {
                line: 0,
                character: 10
            }
        };
        if (this.editDiagramLocker.allowEdit && range !== undefined) {
            this.codeActionProvider.setTarget(request.elementId)
            const codeActions = await this.codeActionProvider.getCodeActions(range, 'sprotty.create');
            if (codeActions) {
                const buttons: PaletteButtonSchema[] = [];
                codeActions.forEach(codeAction => {
                    if (CodeAction.is(codeAction)) {
                        buttons.push(<PaletteButtonSchema>{
                            id: codeAction.title,
                            type: 'button:create',
                            codeActionKind: codeAction.kind,
                            range
                        })
                    }
                })
                return <HtmlRootSchema>{
                    id: "palette",
                    type: "palette",
                    classes: ['sprotty-palette'],
                    children: buttons,
                    canvasBounds: request.bounds
                };
            }
        }

        return undefined;
    }

    /**
     * Finds the tooltip defined in the SKGraphElement in its rendering with the given ID.
     * @param element The SKGraphElement to look in.
     * @param id The ID of the KRendering within that SKGraphElement.
     */
    protected findTooltip(element: SKGraphElement, id: string): string | undefined {
        if (element.tooltip) {
            return element.tooltip
        }
        const rendering = findRendering(element, id)
        if (rendering) {
            return rendering.tooltip
        }
    }

}
