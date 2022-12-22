import {Modal} from "obsidian";
import {getAuth, signInWithCustomToken} from "@firebase/auth";
import {doc, getFirestore, updateDoc} from "@firebase/firestore";
import HintsPlugin from "../main";

export class AuthModal extends Modal {
    private _connected = false;
    private _error = false;

    constructor(private plugin: HintsPlugin) {
        super(plugin.app);
    }

    onOpen() {
        this.render();
    }

    onClose() {
    }

    async authorize(token: string) {
        this.open();

        try {
            const credentials = await signInWithCustomToken(getAuth(this.plugin.firebaseApp), token)
            console.info('Authorized in Hints', credentials);

            const db = getFirestore(this.plugin.firebaseApp);
            const userRef = doc(db, `users/${credentials.user.uid}`);
            await updateDoc(userRef, 'obsidian.connected', true);
            this.connected = true;
        } catch (e) {
            this.error = true;
        }
    }

    set connected(value: boolean) {
        this._connected = value;
        this.render();
    }

    set error(value: boolean) {
        this._error = value;
        this.render();
    }

    private render() {
        let { contentEl } = this;
        contentEl.empty();
        if (this._error) {
            contentEl.createEl('p', { text: 'Looks like authorization token is expired. Please try again' });
        } else if (this._connected) {
            contentEl.createEl('p', { text: 'You have successfully connected to Hints!' });
            contentEl.createEl('p', { text: 'Go back to Hints app and click `Publish Flow`' });
        } else {
            contentEl.createEl('p', { text: 'Loading...' });
        }
    }
}
