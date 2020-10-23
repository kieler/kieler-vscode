/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { createKeithDiagramContainer } from '@kieler/keith-sprotty/lib';
import { Container, injectable } from 'inversify';
import {
    CodeActionProvider,
    CompletionLabelEditor, DeleteWithWorkspaceEditCommand, DiagramConfiguration, EditDiagramLocker, IRootPopupModelProvider, LSTheiaDiagramServer, LSTheiaDiagramServerProvider,
    PaletteButton,
    PaletteMouseListener,
    RenameLabelEditor, TheiaDiagramServer, TheiaKeyTool, WorkspaceEditCommand
} from 'sprotty-theia/lib';
import { configureCommand, configureModelElement, KeyTool, TYPES } from 'sprotty/lib';
import { KeithDiagramServer } from './keith-diagram-server';
import { PaletteButtonView } from '@kieler/keith-sprotty/lib/html-views'
import { OwnCodeActionProvider } from './OwnCodeActionProvider';
import { PopupModelProvider } from './popup';

export const diagramType: string = 'keith-diagram'

/**
 * Dependency injection container for KEITH diagram configuration.
 * Based on the theia-yang-extension implementation by TypeFox.
 * @see https://github.com/theia-ide/yangster/blob/master/theia-yang-extension/src/frontend/yangdiagram/di.config.ts
 */
@injectable()
export class KeithDiagramConfiguration implements DiagramConfiguration {
    diagramType: string = diagramType

    createContainer(widgetId: string): Container {
        const container = createKeithDiagramContainer(widgetId)
        container.bind(KeithDiagramServer).toSelf().inSingletonScope()
        container.bind(TheiaDiagramServer).toService(KeithDiagramServer)
        container.bind(LSTheiaDiagramServer).toService(KeithDiagramServer)
        container.bind(TYPES.ModelSource).toService(TheiaDiagramServer)
        container.bind(EditDiagramLocker).toSelf().inSingletonScope()
        container.rebind(KeyTool).to(TheiaKeyTool).inSingletonScope()
        // container.bind(IRootPopupModelProvider).to(PopupModelProvider)

        container.bind(LSTheiaDiagramServerProvider).toProvider<LSTheiaDiagramServer>((context) => {
            return () => {
                return new Promise<LSTheiaDiagramServer>((resolve) => {
                    resolve(context.container.get(LSTheiaDiagramServer))
                })
            }
        })

        container.bind(OwnCodeActionProvider).toSelf().inSingletonScope();
        container.bind(CodeActionProvider).to(OwnCodeActionProvider).inSingletonScope();
        container.bind(IRootPopupModelProvider).to(PopupModelProvider).inSingletonScope();
        container.bind(PaletteMouseListener).toSelf().inSingletonScope();
        container.rebind(TYPES.PopupMouseListener).to(PaletteMouseListener)
        configureModelElement(container, 'button:create', PaletteButton, PaletteButtonView);

        configureCommand(container, DeleteWithWorkspaceEditCommand)
        configureCommand(container, WorkspaceEditCommand)

        container.bind(CompletionLabelEditor).toSelf().inSingletonScope();
        container.bind(RenameLabelEditor).toSelf().inSingletonScope();

        return container
    }
}