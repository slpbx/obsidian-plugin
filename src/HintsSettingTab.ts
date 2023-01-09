import {MomentFormatComponent, PluginSettingTab, Setting, TextAreaComponent, Platform} from "obsidian";
import {getAuth} from "@firebase/auth";
import HintsPlugin from "../main";
import {FileSuggestModal} from "./FileSuggestModal";
import {appHasDailyNotesPluginLoaded, getDailyNoteSettings} from "obsidian-daily-notes-interface";

export class HintsSettingTab extends PluginSettingTab {
    private authUnsubscriber: (() => void) | undefined;

    constructor(private plugin: HintsPlugin) {
        super(plugin.app, plugin);
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        const auth = getAuth(this.plugin.firebaseApp);

        if (!this.authUnsubscriber) {
            this.authUnsubscriber = auth.onAuthStateChanged(() => {
                this.display();
            })
        }

        if (auth.currentUser) {
            containerEl.createEl('h3', {text: 'Account'});
            new Setting(containerEl)
                .setName(auth.currentUser.displayName ?? 'Account')
                .setDesc(auth.currentUser.email ?? auth.currentUser.uid)
                .addButton((cb) => {
                    cb
                        .setCta()
                        .setButtonText("Open Hints")
                        .onClick(async () => {
                            window.open('https://i.hints.so/', '_blank')
                        });
                })
                .addButton((cb) => {
                    cb.setButtonText("Logout")
                        .onClick(async () => {
                            await auth.signOut()
                            this.display();
                        });
                });

            containerEl.createEl('h3', {text: 'General settings'});

            if (appHasDailyNotesPluginLoaded()) {
                const dailyNoteSettings = getDailyNoteSettings();
                new Setting(containerEl)
                    .setName('Append to daily note')
                    .addToggle((cb) => {
                        cb.setValue(this.plugin.settings.appendToDailyNote)
                        cb.onChange(async (value) => {
                            this.plugin.settings.appendToDailyNote = value
                            await this.plugin.saveSettings()
                            this.display()
                        })
                    })
                    .then((setting) => {
                        setting.descEl.appendChild(createFragment(frag => {
                            frag.createSpan({text: 'Append to daily note: '});
                            frag.createEl('b', {cls: 'u-pop', text: `${dailyNoteSettings.folder}/${dailyNoteSettings.format}`})
                        }))
                    })
            }

            if (!this.plugin.settings.appendToDailyNote || !appHasDailyNotesPluginLoaded()) {
                new Setting(containerEl)
                    .setName('Append to file')
                    .addText((cb) => {
                        cb.setValue(this.plugin.settings.appendPath ?? 'Select file')

                        cb.inputEl.setAttr('readonly', 'readonly')
                        cb.inputEl.onclick = () => {
                            const modal = new FileSuggestModal(this.plugin, async (file) => {
                                this.plugin.settings.appendPath = file.path
                                await this.plugin.saveSettings()
                                this.display()
                            })
                            modal.open();
                        }
                    })
            }

            new Setting(containerEl)
                .setName('Template')
                .setDesc(createFragment((frag) => {
                    frag.createEl('span', {text: 'You can use the following variables: '})
                    frag.createEl('b', {text: '{{content}}', cls: 'u-pop'})
                    frag.createEl('span', {text: ', '})
                    frag.createEl('b', {text: '{{date}}', cls: 'u-pop'})
                    frag.createEl('span', {text: ' and '})
                    frag.createEl('b', {text: '{{time}}', cls: 'u-pop'})
                }))

            new TextAreaComponent(containerEl)
                .setValue(this.plugin.settings.appendTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.appendTemplate = value
                    await this.plugin.saveSettings()
                })
                .then(cb => {
                    cb.inputEl.style.minWidth = '100%';
                    cb.inputEl.style.maxWidth = '100%';
                    cb.inputEl.style.minHeight = '100px';
                })

            new Setting(containerEl)
                .setName('Date format')
                .setDesc('{{date}} in template will be replaced with this value.')
                .then(setting => {
                    addMomentFormat(setting, (cb) => {
                        cb.setValue(this.plugin.settings.dateFormat)
                        cb.onChange(async (value) => {
                            this.plugin.settings.dateFormat = value
                            await this.plugin.saveSettings()
                        })
                    })
                })

            new Setting(containerEl)
                .setName('Time format')
                .setDesc('{{time}} in template will be replaced with this value.')
                .then(setting => {
                    addMomentFormat(setting, (cb) => {
                        cb.setValue(this.plugin.settings.timeFormat)
                        cb.onChange(async (value) => {
                            this.plugin.settings.timeFormat = value
                            await this.plugin.saveSettings()
                        })
                    })
                })

            if (Platform.isDesktop) {
                containerEl.createEl('h3', {text: 'Appearance'});
                new Setting(containerEl)
                    .setName('Show in status bar')
                    .setDesc('Show Hints icon in status bar')
                    .addToggle((cb) => {
                        cb.setValue(this.plugin.settings.showInStatusBar)
                        cb.onChange(async (value) => {
                            this.plugin.settings.showInStatusBar = value
                            await this.plugin.saveSettings()
                            await this.plugin.statusBar.setDefaultState();
                        })
                    })
            }
        } else {
            containerEl.createEl('h2', {text: 'Account'});
            new Setting(containerEl)
                .setName('Auth required')
                .setDesc('Please complete authorization in Hints')
                .addButton((cb) => {
                    cb.setCta().setButtonText("Go to Hints")
                        .onClick(async () => {
                            window.open('https://i.hints.so/', '_blank')
                        });
                });
        }
    }

    hide(): any {
        this.authUnsubscriber?.();
        return super.hide();
    }
}

function addMomentFormat(setting: Setting, cb: (component: MomentFormatComponent) => any) {
    setting.addMomentFormat((momentFormat) => {
        cb(momentFormat);

        setting.descEl.appendChild(
            createFragment((frag) => {
                frag.createEl('br')
                frag.createEl('span', {text: 'For more syntax, refer to '})
                frag.createEl('a', {text: 'format reference', href: 'https://momentjs.com/docs/#/displaying/format/'}, (a) => {
                    a.setAttr('target', '_blank');
                });
                frag.createEl('br')
                frag.createEl('span', {text: 'Your current syntax looks like this: '})
                momentFormat.setSampleEl(frag.createEl('b', {cls: 'u-pop'}))
            })
        )
    })
}
