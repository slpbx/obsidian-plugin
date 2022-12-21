import {AppendStrategy} from "./AppendStrategy";
import HintsPlugin from "../../main";
import {moment, TFile} from "obsidian";
import {
    appHasDailyNotesPluginLoaded, createDailyNote,
    getAllDailyNotes,
    getDailyNote
} from "obsidian-daily-notes-interface";

export class DailyNoteStrategy implements AppendStrategy {
    private dailyNotes: Record<string, TFile> | null

    constructor(private plugin: HintsPlugin) {
    }

    async resolveFile(date: Date): Promise<TFile> {
        if (!this.plugin.settings.appendToDailyNote || !appHasDailyNotesPluginLoaded()) {
            throw new Error("No daily note plugin loaded");
        }

        if (!this.dailyNotes) {
            try {
                this.dailyNotes = getAllDailyNotes() ?? {};
            } catch (e) {
                this.dailyNotes = {};
            }
        }

        const note = getDailyNote(moment(date), this.dailyNotes) as TFile | undefined
        if (note) {
            return note;
        }

        return createDailyNote(moment(date));
    }
}
