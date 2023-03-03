import { TreeDataProvider, EventEmitter, Event, Uri, TreeItem, window, l10n, TreeItemCollapsibleState, Command, Position } from "vscode";
import { Card } from "../models/Card";
import { General } from "../models/General";
import { Package } from "../models/Package";
import { SunGod } from "../models/Sanguosha";

export class SanguoshaPackagesProvider implements TreeDataProvider<any> {
    private _onDidChangeTreeData: EventEmitter<any | undefined | null | void> = new EventEmitter<any | undefined | null | void>();
    readonly onDidChangeTreeData: Event<any | undefined | null | void> = this._onDidChangeTreeData.event;

    private sanguosha: SunGod = new SunGod();
    private rootUri: Uri;

    constructor(rootUri: Uri) {
        this.rootUri = rootUri;

        const editor = window.activeTextEditor;
        if (editor) {
            let document = editor.document;
            const documentText = document.getText();
            this.sanguosha.readQsgsRaw(documentText);
        }

    }

    // 用于刷新
    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: any): TreeItem {
        if (element instanceof Package) {
            let item = new TreeItem(this.sanguosha.getTranslation(element.trsName), TreeItemCollapsibleState.Expanded);
            item.description = element.type;
            return item;

        } else if (element instanceof General) {
            let item = new TreeItem(this.sanguosha.getTranslation(element.trsName), TreeItemCollapsibleState.Collapsed);
            item.description = this.sanguosha.getTranslation('#' + element.trsName);
            item.tooltip = l10n.t('HP:{hp}|Sex:{sex}|Kingdom:{kingdom}', {
                hp: element.hp,
                sex: element.isMale ? l10n.t('Male') : l10n.t('Female'),
                kingdom: element.kingdom
            });
            item.iconPath = {
                light: Uri.joinPath(this.rootUri, 'image', 'generals', 'avatar', element.trsName + '.png'),
                dark: Uri.joinPath(this.rootUri, 'image', 'generals', 'avatar', element.trsName + '.png')
            };


            const editor = window.activeTextEditor;
            if (editor) {
                let document = editor.document;

                if (element.loc) {
                    item.command = {
                        command: 'extension.gotoPosition',
                        title: 'Go to Position',
                        arguments: [document.uri, new Position(element.loc.start.line-1, element.loc.start.column), new Position(element.loc.end.line-1, element.loc.end.column)]
                    };
                }

            }

            return item;

        } else if (element instanceof Card) {
            let item = new TreeItem(this.sanguosha.getTranslation(element.trsName), TreeItemCollapsibleState.None);
            return item;

        } else if (element instanceof Skill) {
            let item = new TreeItem(this.sanguosha.getTranslation(element.trsName), TreeItemCollapsibleState.None);
            return item;

        } else {
            let item = new TreeItem(l10n.t('Invalid element'), TreeItemCollapsibleState.None);
            return item;
        }
    }

    getChildren(element?: any): Thenable<any[]> {
        // 判断工作区目录是否为空，留着吧，虽然看上去没啥用
        if (!this.rootUri) {
            window.showInformationMessage(l10n.t('No general in empty workspace'));
            return Promise.resolve([]);
        }

        if (element) {
            // 含参数执行，子节点
            return new Promise(resolve => {
                if (element instanceof Package) {
                    let children = [];
                    children.push(...element.generals);
                    children.push(...element.cards);
                    resolve(children);
                } else if (element instanceof General) {
                    resolve(element.skills);
                } else if (element instanceof Card) {
                    resolve([]);
                } else if (element instanceof Skill) {
                    resolve([]);
                } else {
                    resolve([]);
                }
            });
        } else {
            // 无参数执行，根节点
            if (this.sanguosha) {
                return Promise.resolve(this.sanguosha.packages);
            } else {
                window.showInformationMessage(l10n.t('Unable to read the Sanguosha extensions'));
                return Promise.resolve([]);
            }
        }
    }
}

class SanguoshaTreeItem extends TreeItem {
    constructor(
        name: string,
        info: string,
        tip: string,
        collapsibleState: TreeItemCollapsibleState,
        imageUri?: Uri,
        cmd?: Command
    ) {
        super(name, collapsibleState);
        this.tooltip = tip;
        this.description = info;
        if (imageUri) {
            this.iconPath = {
                light: imageUri,
                dark: imageUri
            };
        }
        if (cmd) {
            this.command = cmd;
        }
    }

}