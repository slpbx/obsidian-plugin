import HintsPlugin from "../main";
import {setIcon} from "obsidian";
import {getAuth} from "@firebase/auth";

export class StatusBar {

    private element: HTMLElement;

    private iconElement: HTMLElement;
    private hintsElement: HTMLElement;

    constructor(private plugin: HintsPlugin) {
        this.element = plugin.addStatusBarItem();

        this.element.addClass('mod-clickable');
        this.element.setAttr('aria-label-position', 'top')

        this.iconElement = this.element.createSpan({ text: '' });
        this.iconElement.style.marginRight = '5px';
        this.hintsElement = this.element.createSpan({ text: "Hints" });

        this.updateState('refresh-cw', 'Loading...')
    }

    updateState(icon: string, description: string | null, options: { forceShow?: boolean; error?: boolean } = {}) {
        const show = this.plugin.settings.showInStatusBar || options.forceShow

        setIcon(this.iconElement, icon);
        this.element.setAttr('aria-label', description ?? '')
        this.element.style.color = options.error ? 'var(--text-error)' : '';
        this.element.style.padding = show ? '0 var(--size-2-2)' : '0';
        this.element.style.display = show ? '' : 'none';
    }

    setDefaultState() {
        const user = getAuth(this.plugin.firebaseApp).currentUser;
        if (user) {
            this.updateState('check-circle-2', `Signed in as ${user.email}`)
        } else {
            this.updateState('alert-circle', 'Auth required', {
                forceShow: true,
                error: true,
            })
        }
    }
}
