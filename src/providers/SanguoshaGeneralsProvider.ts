import path = require('path');
import { Event, EventEmitter, FileChangeType, l10n, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window } from 'vscode';
import { FileSystemHelper } from '../helpers/FileSystemHelper';
import { LogHelper } from '../helpers/LogHelper';
import { SanguoshaHelper } from '../helpers/SanguoshaHelper';
import { General } from '../models/General';
import { Package } from '../models/Package';
import { Sanguosha } from '../models/Sanguosha';

export class SanguoshaGeneralsProvider implements TreeDataProvider<GeneralTreeItem> {
    private _onDidChangeTreeData: EventEmitter<GeneralTreeItem | undefined | null | void> = new EventEmitter<GeneralTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: Event<GeneralTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private sanguosha?: Sanguosha;
    private rootUri: Uri;

    constructor(rootUri: Uri) {
        this.rootUri = rootUri;
    }

    // 用于刷新
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GeneralTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: GeneralTreeItem): Thenable<GeneralTreeItem[]> {
        // 判断工作区目录是否为空，留着吧，虽然看上去没啥用
        if (!this.rootUri) {
            window.showInformationMessage(l10n.t('No general in empty workspace'));
            return Promise.resolve([]);
        }

        if (element) {
            // 含参数执行，子节点
            return Promise.resolve([]);
        } else {
            // 无参数执行，根节点
            if (this.sanguosha) {
                let generals: GeneralTreeItem[] = [];
                for (const pack of this.sanguosha.packages) {
                    for (const general of pack.generals) {
                        generals.push(new GeneralTreeItem(general.trsName,
                            l10n.t('HP:{hp}|Sex:{sex}|Kingdom:{kingdom}', {
                                hp: general.hp,
                                sex: general.isMale ? l10n.t('Male') : l10n.t('Female'),
                                kingdom: general.kingdom
                            }),
                            TreeItemCollapsibleState.Collapsed)
                        );
                    }
                };
                return Promise.resolve(generals);
            } else {
                window.showInformationMessage(l10n.t('Unable to read the Sanguosha extensions'));
                return Promise.resolve([]);
            }
        }
    }
}

class GeneralTreeItem extends TreeItem {
    constructor(
        public readonly name: string,
        public readonly info: string,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(name, collapsibleState);
        this.tooltip = `${this.name}-${this.info}`;
        this.description = info;
    }

    iconPath = {
        light: Uri.joinPath(Uri.file(__dirname), '..', '..', 'resources', 'icons', 'light', 'dependency.svg'),
        dark: Uri.joinPath(Uri.file(__dirname), '..', '..', 'resources', 'icons', 'dark', 'dependency.svg')
    };
}