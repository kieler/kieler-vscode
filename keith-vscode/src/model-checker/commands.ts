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
import * as vscode from 'vscode'

export const REALOD_PROPERTIES_VERIFICATION: vscode.Command = {
    command: 'keith-vscode.verification-load-properties',
    title: 'Reload Properties',
}

export const RUN_CHECKER_VERIFICATION: vscode.Command = {
    command: 'keith-vscode.verification-run-checker',
    title: 'Start Verification',
}
