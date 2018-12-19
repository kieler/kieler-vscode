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

import { ContainerModule } from 'inversify'
import { DiagramConfiguration, DiagramWidgetRegistry } from 'theia-sprotty/lib'
import { KeithDiagramConfiguration } from './di.config'
import { DiagramManager, DiagramManagerProvider } from 'theia-sprotty/lib'
import { KeithDiagramManager } from './keith-diagram-manager'
import { FrontendApplicationContribution, OpenHandler } from '@theia/core/lib/browser'
import 'sprotty/css/sprotty.css'
import 'theia-sprotty/css/theia-sprotty.css'
import { ThemeManager } from './theme-manager'
import { ContextMenuCommands } from './dynamic-commands';
import { KeithDiagramLanguageClientContribution } from './keith-diagram-language-client-contribution';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { CommandContribution } from '@theia/core';
import { KeithDiagramCommandContribution } from './keith-diagram-command-contribution';
import { KeithDiagramWidgetRegistry } from './keith-diagram-widget-registry';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(LanguageClientContribution).toDynamicValue(ctx => ctx.container.get(KeithDiagramLanguageClientContribution))
    bind(DiagramConfiguration).to(KeithDiagramConfiguration).inSingletonScope()
    bind(DiagramManagerProvider).toProvider<DiagramManager>(context => {
        return () => {
            return new Promise<DiagramManager>((resolve) =>
                resolve(context.container.get(KeithDiagramManager))
            )
        }
    }).whenTargetNamed('keith-diagram')
    bind(KeithDiagramManager).toSelf().inSingletonScope()
    bind(FrontendApplicationContribution).toDynamicValue(context => context.container.get(KeithDiagramManager))
    bind(OpenHandler).toDynamicValue(context => context.container.get(KeithDiagramManager))

    bind(ThemeManager).toSelf().inSingletonScope()
    bind(ContextMenuCommands).to(ContextMenuCommands).inSingletonScope()

    bind(KeithDiagramLanguageClientContribution).toSelf().inSingletonScope()
    bind(CommandContribution).to(KeithDiagramCommandContribution).inSingletonScope()
    rebind(DiagramWidgetRegistry).to(KeithDiagramWidgetRegistry).inSingletonScope()
    bind(KeithDiagramWidgetRegistry).toSelf().inSingletonScope()
})