/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/**
 * A IDiagramPieceRequestGenerator manages the ordering of diagram piece
 * requests.
 */
export interface IDiagramPieceRequestManager {
    /**
     * Add a diagram piece that should be requested later.
     * @param id id of diagram piece
     */

    push(id: string): void
    /**
     * Get id of next diagram piece that should be requested and remove it
     * from the manager.
     */
    pop(): string | undefined

    /**
     * Reset the manager for a different diagram.
     */
    reset(): void

    /**
     * Retrieves same element as pop, but doesn't remove it.
     */
    peek(): string | undefined
    // TODO: add methods which supply info about user viewport so that the manager can 
    //       adjust the ordering of items
}

export class QueueDiagramPieceRequestManager implements IDiagramPieceRequestManager {
    
    piecesToRequest: string[] = []
    
    push(id: string): void {
        this.piecesToRequest.push(id)
    }
    pop(): string | undefined {
        return this.piecesToRequest.pop()
    }
    reset(): void {
        this.piecesToRequest = []
    }
    peek(): string | undefined {
        if (this.piecesToRequest.length === 0) {
            return undefined
        } else {
            return this.piecesToRequest[this.piecesToRequest.length - 1]
        }
    }
}