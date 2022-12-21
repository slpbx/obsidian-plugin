import {prepareFuzzySearch, SuggestModal, TFile} from "obsidian";
import HintsPlugin from "../main";
export class FileSuggestModal extends SuggestModal<TFile> {
    constructor(private plugin: HintsPlugin, private onSelect: (file: TFile) => void) {
        super(plugin.app);
    }

    getSuggestions(query: string): any[] | Promise<TFile[]> {
        const search = prepareFuzzySearch(query)
        return this.plugin.app.vault.getFiles()
            .filter(file => search(file.path));
    }

    renderSuggestion(value: TFile, el: HTMLElement): any {
        el.setText(value.path);
    }

    onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): any {
        this.close();
        this.onSelect(item);
    }
}
