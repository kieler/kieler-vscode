import { CodeActionProvider, LSTheiaDiagramServerProvider } from "sprotty-theia";
import { injectable, inject } from 'inversify';
import { CodeAction, CodeActionParams, Range } from '@theia/languages/lib/browser';

@injectable()
export class OwnCodeActionProvider extends CodeActionProvider {

    private GET_CODE_ACTIONS = 'keith/codeActions/getCodeActions'
    private target = ""

    @inject(LSTheiaDiagramServerProvider) diagramServerProvider: LSTheiaDiagramServerProvider;

    async getCodeActions(range: Range, codeActionKind: string) {
        const diagramServer = await this.diagramServerProvider();
        const connector = diagramServer.connector;
        const languageClient = await connector.getLanguageClient();
        return languageClient.sendRequest(this.GET_CODE_ACTIONS, <OwnCodeActionParams>{
            textDocument: {
                uri: diagramServer.sourceUri
            },
            range,
            context: {
                diagnostics: [],
                only: [codeActionKind]
            },
            target: this.target
        }) as Promise<CodeAction[]>
    }

    public setTarget(target: string) {
        this.target = target
    }
}

export interface OwnCodeActionParams extends CodeActionParams {

    target: string
}
