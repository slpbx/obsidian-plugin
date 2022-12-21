import {AppendStrategy} from "./AppendStrategy";
import HintsPlugin from "../../main";
import {TFile} from "obsidian";

export class AppendToFileStrategy implements AppendStrategy {
    private resolvedFile: TFile | null;

    constructor(private plugin: HintsPlugin) {
    }

    async resolveFile(): Promise<TFile> {
        if (!this.plugin.settings.appendPath) {
            throw new Error("No append path configured");
        }
        if (!this.resolvedFile) {
            const file = await this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.appendPath);
            if (file instanceof TFile) {
                this.resolvedFile = file;
                return this.resolvedFile;
            }
            throw new Error(`Could not resolve file ${this.plugin.settings.appendPath}`);
        }
        return this.resolvedFile;
    }
}
