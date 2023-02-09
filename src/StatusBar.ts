import HintsPlugin from "../main";
import {setIcon} from "obsidian";
import {getAuth} from "@firebase/auth";
import {openPluginSettings} from "./utils/openPluginSettings";

export class StatusBar {

    private element: HTMLElement;

    private iconElement: HTMLElement;
    private hintsElement: HTMLElement;

    constructor(private plugin: HintsPlugin) {
        this.element = plugin.addStatusBarItem();

        this.element.addClass('mod-clickable');
        this.element.setAttr('aria-label-position', 'top')
        this.element.onclick = () => { openPluginSettings(plugin.app) }

        this.iconElement = this.element.createSpan({ text: '', cls: 'hints-status-bar-icon' });
        this.hintsElement = this.element.createSpan({ text: "Hints" });

        this.updateState('refresh-cw', 'Loading...')
    }

    updateState(icon: string, description: string | null, options: { forceShow?: boolean; error?: boolean } = {}) {
        const visible = this.plugin.settings.showInStatusBar || options.forceShow

        setIcon(this.iconElement, icon);
        this.element.setAttr('aria-label', description ?? '')
        this.element.removeClass('hints-status-bar-error', 'hints-status-bar-hidden')

        if (options.error) {
            this.element.addClass('hints-status-bar-error');
        }
        if (!visible) {
            this.element.addClass('hints-status-bar-hidden');
        }
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
