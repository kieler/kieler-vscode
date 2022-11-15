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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never

/**
 * Helper type to construct a tuple from a union.
 * @param T enum to transform into an union
 */
export type Tuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
    ? [...Tuple<Exclude<T, W>>, W]
    : []
