import {App} from "obsidian";

export const openPluginSettings = (app: App) => {
    if ('setting' in app) {
        // @ts-ignore
        app.setting.open();
        // @ts-ignore
        app.setting.openTabById("hints-plugin");
    }
}
