/* eslint-disable no-shadow */
/* eslint-disable lines-between-class-members */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
/* eslint-disable spaced-comment */
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

//////// Registering filters ////////

import { DISymbol } from "@kieler/klighd-core/lib/di.symbols";
import { RenderOptionsRegistry } from "@kieler/klighd-core/lib/options/render-options-registry";
import { ProxyFilterArgs } from "@kieler/klighd-core/lib/proxy-view/filters/proxy-view-filters";
import { SendProxyViewAction } from "@kieler/klighd-core/lib/proxy-view/proxy-view-actions";
import { SynthesesRegistry } from "@kieler/klighd-core/lib/syntheses/syntheses-registry";
import { inject, injectable, postConstruct } from "inversify";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand } from "sprotty";
import { Action } from "sprotty-protocol";
import { ProxyViewSCChartFilterCategory, ProxyViewSCChartFilterNodeTypeConnectorState, ProxyViewSCChartFilterNodeTypeControlflowRegion, ProxyViewSCChartFilterNodeTypeDataflowRegion, ProxyViewSCChartFilterNodeTypeHierarchicalState, ProxyViewSCChartFilterNodeTypeSimpleState } from "./scchart-filter-options";

//////// Constants ////////

/** The ID of the property determining the semantic type of a node. */
export const NODE_TYPE_ID = "de.cau.cs.kieler.klighd.nodeType";

/** Contains the IDs for an SSChart's node types. */
export enum SCChartNodeTypes {
    SIMPLE_STATE = "simpleState",
    HIERARCHICAL_STATE = "hierarchicalState",
    CONNECTOR_STATE = "connectorState",
    CONTROLFLOW_REGION = "controlflowRegion",
    DATAFLOW_REGION = "dataflowRegion"
}

//////// Filters ////////

/** Filters proxies by an SCChart's node type. */
export function filterSCChartNodeType({ node }: ProxyFilterArgs): boolean {
    if (!SCChartProxyFilterHandler.isSCChartSynthesis) {
        // Should not filter proxies for other syntheses
        return true;
    }
    switch (node.properties[NODE_TYPE_ID]) {
        case SCChartNodeTypes.SIMPLE_STATE:
            return !SCChartProxyFilterHandler.filterNodeTypeSimpleState;
        case SCChartNodeTypes.HIERARCHICAL_STATE:
            return !SCChartProxyFilterHandler.filterNodeTypeHierarchicalState;
        case SCChartNodeTypes.CONNECTOR_STATE:
            return !SCChartProxyFilterHandler.filterNodeTypeConnectorState;
        case SCChartNodeTypes.CONTROLFLOW_REGION:
            return !SCChartProxyFilterHandler.filterNodeTypeControlflowRegion;
        case SCChartNodeTypes.DATAFLOW_REGION:
            return !SCChartProxyFilterHandler.filterNodeTypeDataflowRegion;
        default:
            // Better to show the proxy if the state is unknown
            return true;
    }
}

//////// Registering filters ////////

/**
 * Registers semantic {@link ProxyFilter}s specific to SCCharts at the {@link ProxyView} and holds the current
 * values of their respective options as specified by the sidebar.
 * @TODO This is just an example/proof of concept for using the proxy-view API to register a semantic filter.
 */
@injectable()
export class SCChartProxyFilterHandler implements IActionHandler, IActionHandlerInitializer {
    //// Sidebar filter options ////
    /** @see {@link ProxyViewSCChartFilterNodeTypeSimpleState} */
    static filterNodeTypeSimpleState: boolean;
    /** @see {@link ProxyViewSCChartFilterNodeTypeHierarchicalState} */
    static filterNodeTypeHierarchicalState: boolean;
    /** @see {@link ProxyViewSCChartFilterNodeTypeConnectorState} */
    static filterNodeTypeConnectorState: boolean;
    /** @see {@link ProxyViewSCChartFilterNodeTypeControlFlowRegion} */
    static filterNodeTypeControlflowRegion: boolean;
    /** @see {@link ProxyViewSCChartFilterNodeTypeDataFlowRegion} */
    static filterNodeTypeDataflowRegion: boolean;

    //// Get filter option values ////
    /** Updates the proxy-view filter options specified in the {@link RenderOptionsRegistry}. */
    private updateFilterOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        SCChartProxyFilterHandler.filterNodeTypeSimpleState = renderOptionsRegistry.getValue(ProxyViewSCChartFilterNodeTypeSimpleState);
        SCChartProxyFilterHandler.filterNodeTypeHierarchicalState = renderOptionsRegistry.getValue(ProxyViewSCChartFilterNodeTypeHierarchicalState);
        SCChartProxyFilterHandler.filterNodeTypeConnectorState = renderOptionsRegistry.getValue(ProxyViewSCChartFilterNodeTypeConnectorState);
        SCChartProxyFilterHandler.filterNodeTypeControlflowRegion = renderOptionsRegistry.getValue(ProxyViewSCChartFilterNodeTypeControlflowRegion);
        SCChartProxyFilterHandler.filterNodeTypeDataflowRegion = renderOptionsRegistry.getValue(ProxyViewSCChartFilterNodeTypeDataflowRegion);
    }

    //// Register the filters ////
    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            const { proxyView } = action as SendProxyViewAction;
            proxyView.registerFilters(
                filterSCChartNodeType
            );
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // Register to receive SendProxyViewActions
        registry.register(SendProxyViewAction.KIND, this);
    }

    //// Synthesis type ////
    /** Whether the current synthesis is an SCChart-synthesis. */
    static isSCChartSynthesis: boolean;
    /** The ID of the synthesis the SCChart filters should be applied to. */
    private static SCCHART_SYNTHESIS_ID = "de.cau.cs.kieler.sccharts.ui.synthesis.SCChartsSynthesis";

    /** Sets {@link isSCChartSynthesis}. */
    private setIsSCChartSynthesis(synthesesRegistry: SynthesesRegistry): void {
        SCChartProxyFilterHandler.isSCChartSynthesis = synthesesRegistry.currentSynthesisID === SCChartProxyFilterHandler.SCCHART_SYNTHESIS_ID;
    }

    /** The registry containing the filter options. */
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    /** The registry containing the syntheses. */
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;

    @postConstruct()
    init(): void {
        // Register SCChart proxy-view filters in registry
        this.renderOptionsRegistry.registerAll(
            ProxyViewSCChartFilterCategory,
            ProxyViewSCChartFilterNodeTypeSimpleState,
            ProxyViewSCChartFilterNodeTypeHierarchicalState,
            ProxyViewSCChartFilterNodeTypeConnectorState,
            ProxyViewSCChartFilterNodeTypeControlflowRegion,
            ProxyViewSCChartFilterNodeTypeDataflowRegion
        );
        // Register to receive updates on registry changes
        this.renderOptionsRegistry.onChange(() => this.updateFilterOptions(this.renderOptionsRegistry));
        this.synthesesRegistry.onChange(() => this.setIsSCChartSynthesis(this.synthesesRegistry));
    }
}
