import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window } from 'vscode';
import { LogHelper } from '../helpers/LogHelper';
import { SanguoshaHelper } from '../helpers/SanguoshaHelper';
import { Sanguosha } from '../models/Sanguosha';

export class SanguoshaGeneralsProvider implements TreeDataProvider<SanguoshaGeneral> {
    private _onDidChangeTreeData: EventEmitter<SanguoshaGeneral | undefined | null | void> = new EventEmitter<SanguoshaGeneral | undefined | null | void>();
    readonly onDidChangeTreeData: Event<SanguoshaGeneral | undefined | null | void> = this._onDidChangeTreeData.event;
    private sanguosha?: Sanguosha = new Sanguosha();
    private rootUri: Uri;

    constructor(rootUri: Uri) {
        this.rootUri = rootUri;
    }

    // 用于刷新
    refresh(): void {
        
        this._onDidChangeTreeData.fire();
        LogHelper.log(__filename);
    }

    getTreeItem(element: SanguoshaGeneral): TreeItem {
        return element;
    }

    getChildren(element?: SanguoshaGeneral): Thenable<SanguoshaGeneral[]> {
        // 判断工作区目录是否为空
        if (!this.rootUri) {
            window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            // 含参数执行，子节点
            return Promise.resolve(
                this.getDepsInPackageJson()

            );
        } else {
            // 无参数执行，根节点

            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            } else {
                window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }

            const generalPath = path.join(this.rootUri, 'extensions');
        }
    }

    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    private getDepsInPackageJson(packageJsonPath: string): SanguoshaGeneral[] {
        if (this.pathExists(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            const toDep = (moduleName: string, version: string): SanguoshaGeneral => {
                if (this.pathExists(path.join(this.rootUri, 'node_modules', moduleName))) {
                    return new SanguoshaGeneral(
                        moduleName,
                        version,
                        TreeItemCollapsibleState.Collapsed
                    );
                } else {
                    return new SanguoshaGeneral(moduleName, version, TreeItemCollapsibleState.None);
                }
            };

            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map(dep =>
                    toDep(dep, packageJson.dependencies[dep])
                )
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep =>
                    toDep(dep, packageJson.devDependencies[dep])
                )
                : [];
            return deps.concat(devDeps);
        } else {
            return [];
        }
    }
}
class SanguoshaGeneral extends TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    iconPath = {
        light: Uri.joinPath(Uri.file(__filename), '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: Uri.joinPath(Uri.file(__filename), '..', '..', 'resources', 'dark', 'dependency.svg')
    };
}