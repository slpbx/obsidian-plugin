import {SuggestModal, TFile} from "obsidian";
import * as React from "react";
import HintsPlugin from "../main";
export class FileSuggestModal extends SuggestModal<TFile> {
    constructor(private plugin: HintsPlugin, private onSelect: (file: TFile) => void) {
        super(plugin.app);
    }

    getSuggestions(query: string): any[] | Promise<TFile[]> {
        return this.plugin.app.vault.getFiles().filter(file => file.path.toLowerCase().includes(query.toLowerCase()));
    }

    renderSuggestion(value: TFile, el: HTMLElement): any {
        el.setText(value.path);
    }

    onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): any {
        this.close();
        this.onSelect(item);
    }
}
