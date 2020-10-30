import { Anchor, IActionDispatcher, IContextMenuService, MenuItem } from "sprotty";
import { injectable, inject } from "inversify"
import { MenuPath, MenuModelRegistry, CommandRegistry, Command, CommandHandler, MenuAction, Disposable} from "@theia/core";
import { ContextMenuRenderer } from "@theia/core/lib/browser";


class KeithCommandHandler implements CommandHandler {

    constructor(readonly menuItem: MenuItem, readonly actionDispatcher?: IActionDispatcher) {}

    execute(...args: any[]) {
        if (this.actionDispatcher && this.menuItem.actions) {
            this.actionDispatcher.dispatchAll(this.menuItem.actions)
        }
    }

    isEnabled(...args: any[]): boolean {
        return this.menuItem.isEnabled ? this.menuItem.isEnabled() : true
    }

    isVisible(...args: any[]): boolean {
        return this.menuItem.isVisible ? this.menuItem.isVisible() : true
    }

    isToggled(...args: any[]): boolean {
        return this.menuItem.isToggled ? this.menuItem.isToggled() : true
    }
}

interface DisposableItem {
    dispose(menuProvider: MenuModelRegistry, commandRegistry: CommandRegistry): void
}

class DisposableMenuAction implements DisposableItem {
    constructor(protected readonly menuAction: MenuAction, protected readonly disposable: Disposable) {}
    dispose(menuProvider: MenuModelRegistry, commandRegistry: CommandRegistry): void {
        menuProvider.unregisterMenuAction(this.menuAction)
        this.disposable.dispose()
    }
}

class DisposableCommand implements DisposableItem {
    constructor(protected readonly command: Command, protected readonly disposable: Disposable) {}
    dispose(menuProvider: MenuModelRegistry, commandRegistry: CommandRegistry): void {
        commandRegistry.unregisterCommand(this.command)
        this.disposable.dispose()
    }
}

export namespace KeithContextMenu {
    export const CONTEXT_MENU: MenuPath = ['keith-context-menu']
}

@injectable()
export class KeithContextMenuService implements IContextMenuService {

    protected actionDispatcher?: IActionDispatcher

    constructor(@inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer,
    @inject(MenuModelRegistry) protected readonly menuProvider: MenuModelRegistry,
    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry) {}

    connect(actionDispatcher: IActionDispatcher) {
        this.actionDispatcher = actionDispatcher
    }

    show(items: MenuItem[], anchor: Anchor, onHide?: () => void): void {
        const disposables = this.register(KeithContextMenu.CONTEXT_MENU, items);
        const renderOptions = {
            menuPath: KeithContextMenu.CONTEXT_MENU, anchor: anchor,
            onHide: () => { if (onHide) onHide(); window.setTimeout(() => this.cleanUp(disposables), 500)}
        }
        this.contextMenuRenderer.render(renderOptions)
    }

    protected register(menuPath: string[], items: MenuItem[]): DisposableItem[] {
        const disposables: DisposableItem[] = []
        for (const item of items) {
            if (item.children) {
                const menuPathOfItem = item.group ? [...menuPath, item.group] : menuPath;
                disposables.push(this.registerSubmenu(menuPathOfItem, item))
                disposables.push(...this.register([...menuPathOfItem, item.id], item.children))
            } else {
                disposables.push(this.registerCommand(menuPath, item))
                disposables.push(this.registerMenuAction(menuPath, item))
            }
        }
        return disposables
    }

    protected registerSubmenu(menuPath: string[], item: MenuItem): DisposableItem {
        return this.menuProvider.registerSubmenu([...menuPath, item.id], item.label)
    }

    protected registerCommand(menuPath: string[], item: MenuItem): DisposableItem {
        const command: Command = { id: commandId(menuPath, item), label: item.label, iconClass: item.icon}
        const disposable = this.commandRegistry.registerCommand(command, new KeithCommandHandler(item, this.actionDispatcher))
        return new DisposableCommand(command, disposable)
    }

    protected registerMenuAction(menuPath: string[], item: MenuItem): DisposableItem {
        const menuAction = { label: item.label, order: item.sortString, commandId: commandId(menuPath, item)}
        const menuPathOfItem = item.group ? [...menuPath, item.group] : menuPath
        const disposable = this.menuProvider.registerMenuAction(menuPathOfItem, menuAction)
        return new DisposableMenuAction(menuAction, disposable)
    }

    protected cleanUp(disposables: DisposableItem[]) {
        disposables.forEach(disposable => disposable.dispose(this.menuProvider, this.commandRegistry))
    }
}

function commandId(menuPath: string[], item: any): string {
    return menuPath.join(".") + "." + item.id
}


