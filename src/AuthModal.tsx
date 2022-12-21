import {Modal} from "obsidian";
import {createRoot, Root} from "react-dom/client";
import * as React from "react";
import {AppContext} from "./contexts/AppContext";
import {getAuth, signInWithCustomToken} from "@firebase/auth";
import {doc, getFirestore, updateDoc} from "@firebase/firestore";
import HintsPlugin from "../main";

const ReactModal = ({ connected }: { connected: boolean }) => {
    if (!connected) {
        return <p style={{ textAlign: 'center' }}>Loading...</p>;
    }

    return <p style={{ textAlign: 'center' }}>
        You have successfully connected to Hints!<br/>
        Now continue to the Hints website
    </p>;
}

export class AuthModal extends Modal {
    private reactRoot: Root;
    private connected = false;

    constructor(private plugin: HintsPlugin) {
        super(plugin.app);
    }

    onOpen() {
        this.reactRoot = createRoot(this.containerEl.children[1])
        this.render();
    }

    onClose() {
        this.reactRoot.unmount();
    }

    async authorize(token: string) {
        this.open();

        const credentials = await signInWithCustomToken(getAuth(this.plugin.firebaseApp), token)
        console.info('Authorized in Hints', credentials);

        const db = getFirestore(this.plugin.firebaseApp);
        const userRef = doc(db, `users/${credentials.user.uid}`);
        await updateDoc(userRef, 'obsidian.connected', true);
        this.connected = true;
        this.render();
    }

    private render() {
        this.reactRoot.render(
            <AppContext.Provider value={this.app}>
                <ReactModal connected={this.connected}/>
            </AppContext.Provider>,
        );
    }
}
