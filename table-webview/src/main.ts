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

import '../css/index.css';
import { createTable, patch } from './html';
//import { VNode } from 'snabbdom';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Starter {

    constructor() {
        vscode.postMessage({ readyMessage: 'Template Webview ready' });
        console.log('Waiting for diagram identifier...');
        // add listener for messages
        const eventListener = (message: any) => {
            this.handleMessages(message);
        };
        window.addEventListener('message', eventListener);
    }

    /**
     * Initializes the webview with a header and a placeholder for the templates.
     * @param identifier The identifier of the element that should contain the webview.
     */
    protected initHtml(identifier: string, headers: string[]): void {
        const containerDiv = document.getElementById(identifier + '_container');
        if (containerDiv) {
            const tablePlaceholder = document.createElement("table");
            containerDiv.appendChild(tablePlaceholder);
            const table = createTable(identifier, headers);
            patch(tablePlaceholder, table)
        }
        /* document.addEventListener('click', event => {
            const action = click(event);
            if (action) {
                vscode.postMessage({ action: action });
            }
        }); */
    }

    /**
     * Handles incoming messages from the extension.
     * @param message The received Message.
     */
    protected handleMessages(message: any) {
        if (message.data.identifier) {
            this.initHtml(message.data.identifier, message.data.headers);
        } else {
            console.log("Message not supported: " + message);
        }
    }

}

new Starter();
