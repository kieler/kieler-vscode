/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { getAbsoluteBounds, translate } from 'sprotty';
import { TreeSetPositionConstraintAction } from './actions';
import { RefreshDiagramAction } from '../actions';
import { KNode } from '../constraint-classes';

export function setTreeProperties(nodes: KNode[], data: Map<string, any>, event: MouseEvent) {
    return new RefreshDiagramAction()
}