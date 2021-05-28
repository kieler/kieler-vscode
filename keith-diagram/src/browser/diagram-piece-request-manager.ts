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

import { add, Point, SModelElementSchema, Viewport } from "sprotty"

/**
 * A IDiagramPieceRequestGenerator manages the ordering of diagram piece
 * requests.
 */
export interface IDiagramPieceRequestManager {
    /**
     * Add a diagram piece that should be requested later.
     * @param parentId necessary to determine the position of the piece
     * @param diagramPiece schema of diagram piece
     */

    push(parentId: string, diagramPiece: SModelElementSchema): void
    /**
     * Get id of next diagram piece that should be requested and remove it
     * from the manager.
     */
    pop(): SModelElementSchema | undefined

    /**
     * Reset the manager for a different diagram.
     */
    reset(): void

    /**
     * Retrieves same element as pop, but doesn't remove it.
     */
    peek(): SModelElementSchema | undefined

    /**
     * Submit info about current viewport position to be used to prioritize the ordering of requests.
     */
    setViewport(viewport: Viewport): void
    // TODO: add methods which supply info about user viewport so that the manager can 
    //       adjust the ordering of items
}

export class QueueDiagramPieceRequestManager implements IDiagramPieceRequestManager {
    
    piecesToRequest: SModelElementSchema[] = []
    
    push(_parentId: string, diagramPiece: SModelElementSchema): void {
        this.piecesToRequest.push(diagramPiece)
    }
    pop(): SModelElementSchema | undefined {
        return this.piecesToRequest.shift() // FIFO, pop() would be FILO
    }
    reset(): void {
        this.piecesToRequest = []
    }
    peek(): SModelElementSchema | undefined {
        if (this.piecesToRequest.length === 0) {
            return undefined
        } else {
            return this.piecesToRequest[this.piecesToRequest.length - 1]
        }
    }
    setViewport(_viewport: Viewport): void {
        // TODO: implement simple solution
        console.log("QueueDiagramPieceRequestManager.setViewport is unimplemented")
    }
}

export class GridDiagramPieceRequestManager implements IDiagramPieceRequestManager {
    
    idToAbsolutePositions: Map<string,Point>
    // ordering of elements per grid corresponds to layer, therefore operations on it should be FIFO
    /* https://stackoverflow.com/questions/39005798/fastest-way-of-using-coordinates-as-keys-in-javascript-hashmap */
    gridToPieces: Map<number, SModelElementSchema[]>
    readonly MAX_16BIT_SIGNED = 32767 
    /**
     * Determines how many pixels wide each grid square should be.
     */
    gridResolution = 50
    /**
     * The last known grid position of the viewport.
     */
    currentGridPosition = {x: 0, y: 0}

    getKey(point: Point): number{
        let x = point.x
        let y = point.y
        if (x > this.MAX_16BIT_SIGNED || y > this.MAX_16BIT_SIGNED) {
            throw new Error("Invalid x or y coordinates");
        }
        return (x << 16) | y
    }

    getCoords(key: number): Point {
        let keyX = (key >> 16)
        let keyY = (key & 0xFFFF)
        return { x: keyX, y: keyY }
    }
    
    push(parentId: string, diagramPiece: SModelElementSchema): void {
        if (diagramPiece.type === "node") {
            let castPiece = diagramPiece as any
            if (this.idToAbsolutePositions.get(parentId) !== undefined) {
                // if parent is already known, child position is calculated relative to its parent
                let parentPos = this.idToAbsolutePositions.get(parentId)!
                this.idToAbsolutePositions.set(diagramPiece.id, add(parentPos, castPiece.position))
            } else {
                // otherwise the element must be a top level element
                this.idToAbsolutePositions.set(diagramPiece.id, castPiece.position)
            }
            // add pieces to grid
            let gridX = Math.floor(this.idToAbsolutePositions.get(diagramPiece.id)!.x / this.gridResolution)
            let gridY = Math.floor(this.idToAbsolutePositions.get(diagramPiece.id)!.y / this.gridResolution)
            // let test = this.gridToPieces.get(gridPoint)
            let key = this.getKey({ x: gridX, y: gridY })
            if (this.gridToPieces.get(key) !== undefined) {
                this.gridToPieces.get(key)!.push(diagramPiece)
            } else {
                this.gridToPieces.set(key, [diagramPiece])
            }

        } else {
            // DO NOT DO ANYTHING WITH NON NODE ELEMENTS
            // FIXME: execution probably should reach here and should throw an error
            //        but maybe caller should not worry about this
        }
    }
    pop(): SModelElementSchema | undefined {
        // if something exists in current grid position return that
        let key = this.getKey(this.currentGridPosition)
        let list = this.gridToPieces.get(key)
        if (list !== undefined && list.length > 0) {
            return list.shift()
        } else {
            // check for next closest piece
            /* https://stackoverflow.com/questions/398299/looping-in-a-spiral */
            // TODO: use a spiral over the grid
            let piece: SModelElementSchema | undefined = undefined
            let gridArray = Array.from(this.gridToPieces.keys())
            // have to do this because of:
            /* Type 'IterableIterator<number>' is not an array type or a string type. 
             * Use compiler option '--downlevelIteration' to allow iterating of 
             * iterators.ts(2569) */
            // Otherwise could do for (key of this.gridToPieces.keys())
            for (let square of gridArray){
                let value = this.gridToPieces.get(square)!
                if (value.length > 0) {
                    console.log(value[0].id)
                    piece = value.shift()!
                    return piece
                }
            }
        }
    }
    reset(): void {
        this.idToAbsolutePositions = new Map<string, Point>()
        this.gridToPieces = new Map<number, SModelElementSchema[]>()
        this.currentGridPosition = {x: 0, y: 0}
    }
    peek(): SModelElementSchema | undefined {
        // if something exists in current grid position return that
        let list = this.gridToPieces.get(this.getKey(this.currentGridPosition))
        if (list !== undefined && list.length > 0) {
            return list[0]
        } else {
            // check for next closest piece
            /* https://stackoverflow.com/questions/398299/looping-in-a-spiral */
            // TODO: use a spiral over the grid
            let piece: SModelElementSchema | undefined = undefined
            this.gridToPieces.forEach((value: SModelElementSchema[], _key: number) => {
                if (value.length > 0) {
                    piece = value[0]!
                    return
                }
            })
            return piece
        }
    }
    setViewport(viewport: Viewport): void {
        let gridX = Math.floor(viewport.scroll.x * viewport.zoom / this.gridResolution)
        let gridY = Math.floor(viewport.scroll.y * viewport.zoom / this.gridResolution)
        this.currentGridPosition = {x: gridX, y: gridY}
    }
    
}