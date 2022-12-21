import {TFile} from "obsidian";

export interface AppendStrategy {
    resolveFile(date: Date): Promise<TFile>
}
