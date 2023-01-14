import * as vscode from 'vscode';
import * as path from 'path';

export class SanguoshaSkillsProvider implements vscode.TreeDataProvider<SanguoshaSkill> {
    constructor() { }
  
    getTreeItem(element: SanguoshaSkill): vscode.TreeItem {
      return element;
    }
  
    getChildren(element?: SanguoshaSkill): Thenable<SanguoshaSkill[]> {
      return Promise.resolve([
        new SanguoshaSkill("Open", "Open a Sanguosha Extension folder.", vscode.TreeItemCollapsibleState.None),
        new SanguoshaSkill("Save", "Save all files.", vscode.TreeItemCollapsibleState.None),
        new SanguoshaSkill("Save as", "Save a Copy of this extension.", vscode.TreeItemCollapsibleState.None),
        new SanguoshaSkill("Import", "Import extensions from a zip file.", vscode.TreeItemCollapsibleState.None),
        new SanguoshaSkill("Export", "Package the extension as a zip file.", vscode.TreeItemCollapsibleState.None),
        // new SanguoshaTask("Test","Diagnostics for all codes(preview).",vscode.TreeItemCollapsibleState.None),
      ]);
    }
  }
  
  class SanguoshaSkill extends vscode.TreeItem {
    constructor(
      public readonly label: string,
      private tip: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
      super(label, collapsibleState);
      this.tooltip = `${this.label}-${this.tip}`;
      this.description = tip;
    }
    iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'task.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'task.svg')
    };
    contextValue = 'sanguoshaTask';
  }
  