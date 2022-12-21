import {Plugin, moment, TFile} from 'obsidian';

import {FirebaseApp, FirebaseOptions, initializeApp} from 'firebase/app';
import {getAuth} from "@firebase/auth";
import {AuthModal} from "./src/AuthModal";
import {StatusBar} from "./src/StatusBar";
import {HintsSettingTab} from "./src/HintsSettingTab";
import {collection, getFirestore, onSnapshot, where, query, deleteDoc, Timestamp, orderBy} from "@firebase/firestore";

interface HintsSettings {
    appendPath: string | null,
    appendTemplate: string;
    dateFormat: string;
    timeFormat: string;
    showInStatusBar: boolean;
}

const DEFAULT_SETTINGS: HintsSettings = {
    appendPath: null,
    appendTemplate: '\n---\n#### {{date}}\n{{content}}',
    dateFormat: 'YYYY-MM-DD [at] HH:mm',
    timeFormat: 'HH:mm',
    showInStatusBar: true,
}

const firebaseConfig: FirebaseOptions = {
	apiKey: 'AIzaSyCcp8pZoqG2Ihe4uyeEFKqPIkNtqf6iuaw',
	authDomain: 'slipbox-6f705.firebaseapp.com',
	projectId: 'slipbox-6f705',
};

const firebaseApp = initializeApp(firebaseConfig, 'hints-plugin');

export default class HintsPlugin extends Plugin {
    firebaseApp: FirebaseApp = firebaseApp;
	settings: HintsSettings;
    statusBar: StatusBar

    private authUnsubscribe: () => void;
    private pendingNotesUnsubscribe: (() => void) | undefined;

	async onload() {
		await this.loadSettings();

        this.statusBar = new StatusBar(this)

        this.authUnsubscribe = getAuth(firebaseApp).onAuthStateChanged((user) => {
            this.statusBar.setDefaultState();
            if (user) {
                this.registerPendingNotesListener();
            } else {
                this.unregisterPendingNotesListener();
            }
        })

		this.addSettingTab(new HintsSettingTab(this));

		this.registerObsidianProtocolHandler('hints-auth', async (data) => {
			if (!data.token) {
				return;
			}
			const authModal = new AuthModal(this)
            await authModal.authorize(data.token);
		})
	}

	onunload() {
		this.authUnsubscribe()
        this.unregisterPendingNotesListener();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    private registerPendingNotesListener() {
        const auth = getAuth(this.firebaseApp);
        if (!auth.currentUser) {
            return;
        }

        this.unregisterPendingNotesListener();

        const db = getFirestore(this.firebaseApp);
        const q = query(
            collection(db, "obsidianPendingNotes"),
            where("userId", "==", auth.currentUser.uid),
            orderBy('createdAt', 'asc')
        );
        this.pendingNotesUnsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (!this.settings.appendPath) {
                return;
            }
            const appendFile = app.vault.getAbstractFileByPath(this.settings.appendPath);
            if (!appendFile || !(appendFile instanceof TFile)) {
                return;
            }
            this.statusBar.updateState('refresh-cw', `Adding ${querySnapshot.size} notes...`)
            for (const change of querySnapshot.docChanges()) {
                if (change.type === 'added') {
                    const data = change.doc.data() as {
                        text: string;
                        createdAt: Timestamp;
                        userId: string;
                    }

                    const content = this.settings.appendTemplate
                        .replace('{{date}}', moment(data.createdAt.toDate()).format(this.settings.dateFormat))
                        .replace('{{time}}', moment(data.createdAt.toDate()).format(this.settings.timeFormat))
                        .replace('{{content}}', data.text)

                    await this.app.vault.append(appendFile, `\n${content}`)

                    await deleteDoc(change.doc.ref)
                }
            }
            this.statusBar.setDefaultState();
        });
    }

    private unregisterPendingNotesListener() {
        if (this.pendingNotesUnsubscribe) {
            this.pendingNotesUnsubscribe();
            this.pendingNotesUnsubscribe = undefined;
        }
    }
}
