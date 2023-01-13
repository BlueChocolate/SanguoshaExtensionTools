import { SanguoshaGeneralsProvider } from './provider/SanguoshaGeneralsProvider';
import { SanguoshaTasksProvider } from './provider/SanguoshaTasksProvider';
import { SanguoshaCodelensProvider } from './provider/SanguoshaCodelensProvider';
import { LuaAstHelper } from "./helper/LuaAstHelper";
import { LogHelper } from "./helper/LogHelper";
import { QsgsHelper } from "./helper/QsgsHelper";
import { Disposable, ExtensionContext, Uri, l10n, workspace, window, languages, commands, ConfigurationTarget, StatusBarAlignment } from 'vscode';
import { FileSystemHelper } from './helper/FileSystemHelper';
import { SanguoshaHelper } from './helper/SanguoshaHelper';

// 一次性对象列表
let disposables: Disposable[] = [];

// 当你的扩展被激活时调用这个方法，只执行一次
export async function activate(context: ExtensionContext) {

	// 输出日志信息
	LogHelper.log(l10n.t('Sanguosha Extension Tools is now active!'));

	// NOTE 注册命令
	// Hello World 命令
	let helloWorldCommand = commands.registerCommand('sanguoshaExtensionTools.helloWorld', async () => {

		let str = "Hello World from Sanguosha Extension Tools!";
		const editor = window.activeTextEditor;
		if (editor) {
			let document = editor.document;
			const documentText = document.getText();
			// sgs.sanguosha.readQsgsRaw(documentText);

			const { text } = editor.document.lineAt(editor.selection.active.line);

			try {
				str = LuaAstHelper.astToSource(LuaAstHelper.parse(documentText));
				LogHelper.log(l10n.t('compiled successfully'));
			} catch (error) {
				let e = error as Error;
				LogHelper.log(l10n.t('Lua Compilation failed {errorName} {errorMessage}', { errorName: e.name, errorMessage: e.message }), 'error');
				return;
			}

			await workspace.openTextDocument({ content: str, language: "lua" }).then(async doc => {
				await window.showTextDocument(doc);
				// REVIEW 这里用库不知道会不会好一点
				commands.executeCommand("editor.action.formatDocument");
			});

			window
				.showInformationMessage("Do you want to do this?", "Yes", "No", "Skip")
				.then(answer => {
					if (answer === "Yes") {
						// Run function
					}
				});
		}


		window.showInformationMessage(str);
	});
	// 启用 CodeLens
	commands.registerCommand("sanguoshaExtensionTools.enableCodeLens", () => {
		workspace.getConfiguration("sanguoshaExtensionTools").update("enableCodeLens", true, true);
	});
	// 禁用 CodeLens
	commands.registerCommand("sanguoshaExtensionTools.disableCodeLens", () => {
		workspace.getConfiguration("sanguoshaExtensionTools").update("enableCodeLens", false, true);
	});
	// 点击 CodeLens 时触发事件
	commands.registerCommand("sanguoshaExtensionTools.codelensAction", (args: any) => {
		window.showInformationMessage(`CodeLens action clicked with args=${args}`);
	});
	// 刷新三国杀扩展
	commands.registerCommand('sanguoshaExtensionTools.refreshExtension', () => {
		sanguoshaGeneralsProvider.refresh();
	});
	// 创建三国杀扩展
	commands.registerCommand('sanguoshaExtensionTools.createNewExtension', async () => {

		// 弹出快速选择器
		const select = await window.showQuickPick([
			{ label: 'QSanguosha', description: l10n.t('QSanguosha'), id: 1 },
			{ label: 'Noname', description: l10n.t('Noname'), id: 2 },
			{ label: 'FreeKill', description: l10n.t('FreeKill'), id: 3 }],
			{ placeHolder: l10n.t('Please select the type of Sanguosha extension') }
		);
		// 是否选择了某个项目
		if (select) {
			// 选择的三国杀的类型 
			switch (select.id) {
				case 1:
					const input = await window.showInputBox({
						'ignoreFocusOut': true,
						'placeHolder': l10n.t('Please enter a identification name for the package'),
						'validateInput': (value) => {
							let pattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
							if (!pattern.test(value)) {
								return l10n.t('The extension package identification name can only consist of numbers, letters or underscores, and cannot start with a number!');
							}
						}
					});
					if (input) {
						// 文件夹选择窗口
						const urls = await window.showOpenDialog({
							canSelectFolders: true, // 选择文件夹
							canSelectMany: false // 不可多选
						});

						if (urls && urls.length > 0) {
							await QsgsHelper.createNewExtension(urls[0], input);
							// ANCHOR - 这里填 await 的话，就要等这个消息框被关闭了才会执行下一条语句
							// window.showInformationMessage('新建扩展包：' + urls[0]);
							// 不填写 url 参数的话，系统会自动打开一个文件夹选择对话框
							let success = await commands.executeCommand('openFolder', urls[0]);
							if (success) {

							}
						}
						else {
							window.showInformationMessage('You did not select a folder.');
							return;
						}

					}
					break;
				case 2:
				case 3:
				default:
					window.showInformationMessage(l10n.t('This feature is not yet implemented'));
					break;
			}
		}
	});
	// 添加武将
	commands.registerCommand('sanguoshaExtensionTools.addGeneral', async () => {
		const urls = await window.showOpenDialog({
			canSelectFolders: true, // 选择文件夹
			canSelectMany: false // 可多选
		});
		if (!urls || urls.length < 1) {
			window.showInformationMessage('You did not select a folder.');
			return;
		}
		// 不填写 url 参数的话，系统会自动打开一个文件夹选择对话框
		let success = commands.executeCommand('openFolder', urls[0]);
		window.showInformationMessage('添加武将!' + urls);
	});
	// 编辑武将
	commands.registerCommand('sanguoshaExtensionTools.editGeneral', () => window.showInformationMessage('编辑武将!'));
	// 调试工具
	commands.registerCommand('sanguoshaExtensionTools.showDebugTools', async () => {
		const select = await window.showQuickPick([
			{ label: 'Source code to json AST in new file', description: '将当前打开的 Lua 文件转换为 Json 格式的 AST 并在新文件中打开', id: 1 },
			{ label: 'Noname', description: '无名杀', id: 2 },
			{ label: 'FreeKill', description: '自由杀？', id: 3 }],
			{ placeHolder: '调试工具' }
		);
		if (select) {
			switch (select.id) {
				case 1:
					const editor = window.activeTextEditor;
					if (editor) {
						const luaRaw = editor.document.getText();
						const parser = require('luaparse');
						try {
							let ast = await LuaAstHelper.parse(luaRaw);
							await workspace.openTextDocument({ content: JSON.stringify(ast, null, 2), language: "json" }).then(doc => {
								window.showTextDocument(doc);
							});
						} catch (error) {
							const errorFull = (error as Error).name + (error as Error).message + (error as Error).stack;
							LogHelper.log(errorFull, 'error');
							await window.showInformationMessage(errorFull);
						}
					}
					break;
			}
		}
	});
	// 开始 task
	commands.registerCommand('sanguoshaExtensionTools.startTask', () => window.showInformationMessage('开始!'));
	// 完整加载三国杀扩展包
	commands.registerCommand('sanguoshaExtensionTools.loadExtensions', () => {

	});

	// NOTE 注册事件
	// 文件监视器
	let watcher = workspace.createFileSystemWatcher('**/*');
	watcher.onDidChange(e => {
		LogHelper.log(`File ${e.fsPath} has changed.`);
	});
	watcher.onDidCreate(e => {
		LogHelper.log(`File ${e.fsPath} has created.`);
	});
	watcher.onDidDelete(e => {
		LogHelper.log(`File ${e.fsPath} has deleted.`);
	});
	// 文件内容更改
	workspace.onDidChangeTextDocument(function (e) {
		console.log('changed.');
		// console.log(e.document.isDirty);
	});
	// 文件内容保存
	workspace.onDidSaveTextDocument(function (e) {
		console.log('saved.');
	});



	// NOTE 尝试获取当前打开的文件夹
	const rootPath = workspace.workspaceFolders && workspace.workspaceFolders.length > 0 ? workspace.workspaceFolders[0].uri.fsPath : undefined;

	// 这个方法同样可以文件夹，但工作区文件夹可能不止一个，所以第 0 个就是当前文件夹
	const rootUri = workspace.workspaceFolders && workspace.workspaceFolders.length > 0 ? workspace.workspaceFolders[0].uri : undefined;
	console.log(workspace.getConfiguration().has('sanguoshaExtensionTools.extension.type'));
	if (!rootPath) {
		return;
	}

	if (!rootUri) {
		return;
	}

	// NOTE 尝试从工作区配置中读取三国杀类型
	let type = workspace.getConfiguration().inspect('sanguoshaExtensionTools.extension.type')?.workspaceValue;
	if (type) {
		// TODO 读取三国杀扩展

	} else {
		if (true) {
			type = SanguoshaHelper.detachSanguoshaType(rootUri).then(() => {
				// TODO 读取三国杀扩展？？？
			}).catch((error) => {

			});
			if (type) {
				type = '123';
			}
		} else {

		}
	}


	const sanguoshaGeneralsProvider = new SanguoshaGeneralsProvider(rootPath);
	// NOTE 注册提供者
	window.registerTreeDataProvider('sanguoshaTasks', new SanguoshaTasksProvider());
	// window.registerTreeDataProvider('sanguoshaPackages', new sgs.SanguoshaTasksProvider());


	window.registerTreeDataProvider('sanguoshaGenerals', sanguoshaGeneralsProvider);

	// 注册 CodeLens 提供者
	const codelensProvider = new SanguoshaCodelensProvider();
	languages.registerCodeLensProvider("*", codelensProvider);


	// 回收所有一次性对象
	if (disposables) {
		disposables.forEach(item => context.subscriptions.push(item));
	}
	// context.subscriptions.concat(disposables); // 没试过这种
}

// 当你的扩展被停用时调用这个方法
export function deactivate() {
	// 不知道这玩意和上面的 subscription 是不是一样的
	// if (disposables) {
	// 	disposables.forEach(item => item.dispose());
	// }
	// disposables = [];
}