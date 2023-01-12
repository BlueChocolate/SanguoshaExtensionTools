import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class SanguoshaGeneralsProvider implements vscode.TreeDataProvider<SanguoshaGeneral> {
    constructor(private workspaceRoot: string) { }

    // 用于刷新
    private _onDidChangeTreeData: vscode.EventEmitter<SanguoshaGeneral | undefined | null | void> = new vscode.EventEmitter<SanguoshaGeneral | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SanguoshaGeneral | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
        console.log(path.join(__filename, '..', '..', 'resources', 'light', 'task.svg'));
    }

    getTreeItem(element: SanguoshaGeneral): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SanguoshaGeneral): Thenable<SanguoshaGeneral[]> {
        // 判断工作区目录是否为空
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            // 含参数执行，子节点
            return Promise.resolve(
                this.getDepsInPackageJson(
                    path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
                )
            );
        } else {
            // 无参数执行，第一层节点
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            } else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }

            const generalPath = path.join(this.workspaceRoot, 'extensions');
        }
    }

    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    private getDepsInPackageJson(packageJsonPath: string): SanguoshaGeneral[] {
        if (this.pathExists(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

            const toDep = (moduleName: string, version: string): SanguoshaGeneral => {
                if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
                    return new SanguoshaGeneral(
                        moduleName,
                        version,
                        vscode.TreeItemCollapsibleState.Collapsed
                    );
                } else {
                    return new SanguoshaGeneral(moduleName, version, vscode.TreeItemCollapsibleState.None);
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

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}
class SanguoshaGeneral extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
}