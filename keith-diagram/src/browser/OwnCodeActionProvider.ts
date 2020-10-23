import { CodeActionProvider, LSTheiaDiagramServerProvider } from "sprotty-theia";
import { injectable, inject } from 'inversify';
import { CodeAction, CodeActionParams, Range } from '@theia/languages/lib/browser';

@injectable()
export class OwnCodeActionProvider extends CodeActionProvider {

    private GET_CODE_ACTIONS = 'keith/codeActions/getCodeActions'

    @inject(LSTheiaDiagramServerProvider) diagramServerProvider: LSTheiaDiagramServerProvider;

    async getCodeActions(range: Range, codeActionKind: string) {
        const diagramServer = await this.diagramServerProvider();
        const connector = diagramServer.connector;
        const languageClient = await connector.getLanguageClient();
        return languageClient.sendRequest(this.GET_CODE_ACTIONS, <CodeActionParams>{
            textDocument: {
                uri: diagramServer.sourceUri
            },
            range,
            context: {
                diagnostics: [],
                only: [codeActionKind]
            }
        }) as Promise<CodeAction[]>
    }
}