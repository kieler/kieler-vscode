/** @jsx html */
import { html } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';

import { RenderingContext, IView, SButton } from "sprotty"
import { injectable } from 'inversify';

/**
 * IView component for palette buttons.
 */
@injectable()
export class PaletteButtonView implements IView {

    render(button: SButton, context: RenderingContext): VNode {
        return <div>{button.id}</div>
    }
}