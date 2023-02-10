import path = require("path");
import { Uri, FileType, workspace, l10n, window, ConfigurationTarget, extensions } from "vscode";
import { Sanguosha } from "../models/Sanguosha";
import { LogHelper } from "./LogHelper";

export class SanguoshaHelper {

    protected constructor() { }

    public static sanguosha: Sanguosha | undefined = undefined;

    /* NOTE 太阳神三国杀扩展目录结构
    ├─audio
    │  ├─bgm(*.ogg)
    │  ├─death(*.ogg)
    │  └─skill(*.ogg)
    ├─extensions(*.lua)
    ├─image
    │  ├─animate(*.png)
    │  ├─big-card(*.png)
    │  ├─card(*.png)
    │  ├─fullskin
    │  │  └─generals
    │  │      └─full(*.png)
    │  ├─generals
    │  │  ├─avatar(*.png)
    │  │  └─card(*.png)
    │  └─mark(*.png)
    └─lua
        └─ai(*.lua)
    */
    public static async detachSanguoshaType(rootUri: Uri): Promise<'qSanguosha' | 'noname' | 'freeKill' | undefined> {

        async function uriExists(uri: Uri, type?: FileType): Promise<boolean> {
            try {
                let stat = await workspace.fs.stat(uri);
                if (type) {
                    if (stat.type === type) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } catch (error) {
                if ((error as Error).name === 'EntryNotFound (FileSystemError)') {
                    return false;
                } else {
                    throw error;
                }
            }
        }

        try {
            // 判断是否存在 .\extensions 目录
            if (await uriExists(Uri.joinPath(rootUri, 'extensions'), FileType.Directory)) {

                // 判断 .\extensions 文件夹是否存在 *.lua 文件
                const extensionsTuples = await workspace.fs.readDirectory(Uri.joinPath(rootUri, 'extensions'));
                if (extensionsTuples.filter((item => item[1] === FileType.File && path.extname(item[0]).toLowerCase() === ".lua")).length > 0) {

                    // .\extensions 文件夹存在 lua 文件，是太阳神三国杀
                    return 'qSanguosha';
                } else {

                    // 判断是否存在 .\lua\ai 目录
                    if (await uriExists(Uri.joinPath(rootUri, 'lua', 'ai'), FileType.Directory)) {

                        // 判断 .\extensions 文件夹是否存在 *.lua 文件
                        const extensionsTuples = await workspace.fs.readDirectory(Uri.joinPath(rootUri, 'lua', 'ai'));
                        if (extensionsTuples.filter((item => item[1] === FileType.File && path.extname(item[0]).toLowerCase() === ".lua")).length > 0) {

                            // .\lua\ai 文件夹存在 lua 文件，是太阳神三国杀
                            return 'qSanguosha';
                        } else {
                            return undefined;
                        }
                    } else {
                        return undefined;
                    }
                }
            } else {
                // REVIEW 考虑一下文件扩展名大小写的问题
                // 判断是根目录否存在 extension.js 文件
                if (await uriExists(Uri.joinPath(rootUri, 'extension.js'), FileType.File)) {
                    return 'noname';
                } else {
                    return undefined;
                }
            }
        } catch (error) {
            let e = error as Error;
            LogHelper.log(l10n.t('Failed to detect the Sanguosha extension type {errorName} {errorMessage}', { errorName: e.name, errorMessage: e.message }), 'error');
            return undefined;
        }
    }

    public static async createNewExtension(uri: Uri, trsName: string) {

        if (uri) {
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'extensions'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'lua', 'ai'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'audio', 'bgm'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'audio', 'death'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'audio', 'skill'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'image', 'mark'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'image', 'animate'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'image', 'generals', 'card'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'image', 'generals', 'avatar'));
            await workspace.fs.createDirectory(Uri.joinPath(uri, 'image', 'fullskin', 'generals', 'full'));

            let varName = trsName.length > 1 ? (trsName.slice(0, 1).toUpperCase() + trsName.slice(1).toLowerCase()) : trsName.toUpperCase();
            const writeStr = varName + ' = sgs.Package("' + trsName + '")\n\nreturn ' + varName;
            const writeData = Buffer.from(writeStr, 'utf-8');

            await workspace.fs.writeFile(Uri.joinPath(uri, 'extensions', trsName + '.lua'), writeData);
            await workspace.fs.writeFile(Uri.joinPath(uri, 'lua', 'ai', trsName + '-ai.lua'), new Uint8Array());
        }
    }

    public static async showSanguoshaTypeQuickPicker(): Promise<void> {
        // 弹出快速选择
        const select = await window.showQuickPick(
            [
                { label: 'QSanguosha(Default)', description: '太阳神三国杀（默认）', value: 'qSanguosha' },
                { label: 'Noname', description: '无名杀', value: 'noname' },
                { label: 'FreeKill', description: '自由杀？', value: 'freeKill' }
            ],
            { placeHolder: '这似乎是太阳神三国杀的扩展，请手动确认' });

        if (select) {
            // 默认是储存到 Workspace
            await workspace.getConfiguration().update('sanguoshaExtensionTools.extension.type', select.value);
        } else {
            // 其实这个会自动识别是工作区还是文件夹
            await workspace.getConfiguration().update('sanguoshaExtensionTools.extension.type', 'qSanguosha', ConfigurationTarget.Workspace);
        }
    }


    public static setExternalLibrary(folder: string, enable: boolean) {
        const extensionId = 'undefined_publisher.sanguosha-extension-tools'; // this id is case sensitive
        const extensionPath = extensions.getExtension(extensionId)?.extensionPath;
        const folderPath = extensionPath + "\\" + folder;
        const config = workspace.getConfiguration("Lua");
        const library: string[] | undefined = config.get("workspace.library");
        if (library && extensionPath) {
            // 删除路径的任何旧版本，例如 publisher.name-0.0.1
            for (let i = library.length - 1; i >= 0; i--) {
                const el = library[i];
                const isSelfExtension = el.indexOf(extensionId) > -1;
                const isCurrentVersion = el.indexOf(extensionPath) > -1;
                if (isSelfExtension && !isCurrentVersion) {
                    library.splice(i, 1);
                }
            }
            const index = library.indexOf(folderPath);
            if (enable) {
                if (index === -1) {
                    library.push(folderPath);
                }
            }
            else {
                if (index > -1) {
                    library.splice(index, 1);
                }
            }
            config.update("workspace.library", library, true);
        }
    }
}