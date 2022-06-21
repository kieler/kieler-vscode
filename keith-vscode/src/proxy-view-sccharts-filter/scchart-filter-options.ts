/* eslint-disable lines-between-class-members */
/* eslint-disable prettier/prettier */
/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { RenderOption, TransformationOptionType } from "@kieler/klighd-core/src/options/option-models";
import { ProxyViewFilterCategory } from "@kieler/klighd-core/src/proxy-view/filters/proxy-view-filter-options";

/** The category containing SCChart-specific proxy-view filters. */
export class ProxyViewSCChartFilterCategory implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-category";
    static readonly NAME: string = "SCChart Filters";
    static readonly INSTANCE: ProxyViewSCChartFilterCategory = new ProxyViewSCChartFilterCategory;
    readonly id: string = ProxyViewSCChartFilterCategory.ID;
    readonly name: string = ProxyViewSCChartFilterCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: never;
    readonly renderCategory: RenderOption = ProxyViewFilterCategory.INSTANCE;
    currentValue: never;
}

/** Whether proxies for simple states should be filtered. */
export class ProxyViewSCChartFilterNodeTypeSimpleState implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-node-type-simple-state";
    static readonly NAME: string = "Filter Simple States";
    static readonly DESCRIPTION: string = "Whether proxies for simple states should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSCChartFilterNodeTypeSimpleState.ID;
    readonly name: string = ProxyViewSCChartFilterNodeTypeSimpleState.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSCChartFilterNodeTypeSimpleState.DEFAULT;
    readonly description: string = ProxyViewSCChartFilterNodeTypeSimpleState.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewSCChartFilterCategory.INSTANCE;
    currentValue = ProxyViewSCChartFilterNodeTypeSimpleState.DEFAULT;
}

/** Whether proxies for hierarchical states should be filtered. */
export class ProxyViewSCChartFilterNodeTypeHierarchicalState implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-node-type-hierarchical-state";
    static readonly NAME: string = "Filter Hierarchical States";
    static readonly DESCRIPTION: string = "Whether proxies for hierarchical states should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSCChartFilterNodeTypeHierarchicalState.ID;
    readonly name: string = ProxyViewSCChartFilterNodeTypeHierarchicalState.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSCChartFilterNodeTypeHierarchicalState.DEFAULT;
    readonly description: string = ProxyViewSCChartFilterNodeTypeHierarchicalState.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewSCChartFilterCategory.INSTANCE;
    currentValue = ProxyViewSCChartFilterNodeTypeHierarchicalState.DEFAULT;
}

/** Whether proxies for connector states should be filtered. */
export class ProxyViewSCChartFilterNodeTypeConnectorState implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-node-type-connector-state";
    static readonly NAME: string = "Filter Connector States";
    static readonly DESCRIPTION: string = "Whether proxies for connector states should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSCChartFilterNodeTypeConnectorState.ID;
    readonly name: string = ProxyViewSCChartFilterNodeTypeConnectorState.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSCChartFilterNodeTypeConnectorState.DEFAULT;
    readonly description: string = ProxyViewSCChartFilterNodeTypeConnectorState.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewSCChartFilterCategory.INSTANCE;
    currentValue = ProxyViewSCChartFilterNodeTypeConnectorState.DEFAULT;
}

/** Whether proxies for controlflow regions should be filtered. */
export class ProxyViewSCChartFilterNodeTypeControlflowRegion implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-node-type-controlflow-region";
    static readonly NAME: string = "Filter Controlflow Regions";
    static readonly DESCRIPTION: string = "Whether proxies for controlflow regions should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSCChartFilterNodeTypeControlflowRegion.ID;
    readonly name: string = ProxyViewSCChartFilterNodeTypeControlflowRegion.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSCChartFilterNodeTypeControlflowRegion.DEFAULT;
    readonly description: string = ProxyViewSCChartFilterNodeTypeControlflowRegion.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewSCChartFilterCategory.INSTANCE;
    currentValue = ProxyViewSCChartFilterNodeTypeControlflowRegion.DEFAULT;
}

/** Whether proxies for dataflow regions  should be filtered. */
export class ProxyViewSCChartFilterNodeTypeDataflowRegion implements RenderOption {
    static readonly ID: string = "proxy-view-scchart-filter-node-type-dataflow-region";
    static readonly NAME: string = "Filter Dataflow Regions";
    static readonly DESCRIPTION: string = "Whether proxies for dataflow regions should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSCChartFilterNodeTypeDataflowRegion.ID;
    readonly name: string = ProxyViewSCChartFilterNodeTypeDataflowRegion.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSCChartFilterNodeTypeDataflowRegion.DEFAULT;
    readonly description: string = ProxyViewSCChartFilterNodeTypeDataflowRegion.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewSCChartFilterCategory.INSTANCE;
    currentValue = ProxyViewSCChartFilterNodeTypeDataflowRegion.DEFAULT;
}
