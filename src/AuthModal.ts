import {ButtonComponent, Modal, setIcon} from "obsidian";
import {getAuth, signInWithCustomToken} from "@firebase/auth";
import {doc, getFirestore, updateDoc} from "@firebase/firestore";
import HintsPlugin from "../main";
import {openPluginSettings} from "./utils/openPluginSettings";

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
            contentEl.createEl('p', {text: 'Looks like authorization token is expired. Please try again'});
        } else if (!this._connected) {
            contentEl.createEl('div', {cls: 'hints-auth-modal-loader', text: createFragment((frag) => {
                const iconEl = frag.createEl('i')
                setIcon(iconEl, 'loader-2');
                frag.createSpan({text: 'Loading...'});
            })});
        } else {
            contentEl.createEl('h3', {cls: 'hints-auth-modal-header', text: createFragment((frag) => {
                const iconEl = frag.createEl('i')
                setIcon(iconEl, 'check-circle-2');
                frag.createSpan({text: 'You have successfully connected to Hints!'});
            })});
            contentEl.createEl('p', {text: 'To finish the setup, please click on the "Setup Plugin" button. Then, choose the file where you want your data to be saved by selecting it in the "Append to File" or "Append to Daily Notes" option.'});
            new ButtonComponent(contentEl)
                .setCta()
                .setButtonText("Setup plugin")
                .setClass('hints-auth-modal-button')
                .onClick(() => {
                    this.close()
                    openPluginSettings(this.plugin.app)
                });
        }
    }
}
