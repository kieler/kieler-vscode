/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { FrontendApplicationContribution, OpenHandler, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { ContainerModule } from 'inversify';
import 'sprotty-theia/css/theia-sprotty.css';
import { DiagramConfiguration, DiagramManager, DiagramManagerProvider } from 'sprotty-theia/lib';
import 'sprotty/css/sprotty.css';
import { KeithDiagramConfiguration } from './di.config';
import { KeithDiagramManager } from './keith-diagram-manager';
import { KeithWidgetManager } from './keith-widget-manager';

/**
 * Dependency injection container for the KEITH frontend part of diagram functionality.
 * Based on the theia-yang-extension implementation by TypeFox.
 * @see https://github.com/theia-ide/yangster/blob/master/theia-yang-extension/src/frontend/language/frontend-extension.ts
 */
export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(DiagramConfiguration).to(KeithDiagramConfiguration).inSingletonScope()
    bind(KeithDiagramManager).toSelf().inSingletonScope()
    bind(FrontendApplicationContribution).toService(KeithDiagramManager)
    bind(OpenHandler).toService(KeithDiagramManager)
    bind(WidgetFactory).toService(KeithDiagramManager)
    bind(DiagramManagerProvider).toProvider<DiagramManager>((context) => {
        return () => {
            return new Promise<DiagramManager>((resolve) => {
                let diagramManager = context.container.get<KeithDiagramManager>(KeithDiagramManager)
                resolve(diagramManager)
            })
        }
    })
    rebind(WidgetManager).to(KeithWidgetManager).inSingletonScope()
})