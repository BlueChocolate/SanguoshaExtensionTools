import * as path from 'path';
import { ConfigurationTarget, FileType, l10n, Uri, window, workspace } from 'vscode';
import { LogHelper } from "./LogHelper";
import { FileSystemHelper } from "./FileSystemHelper";
import { BaseHelper } from './BaseHelper';


export class SanguoshaHelper extends BaseHelper {

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
    /** 检测指定路径中三国杀扩展的类型
     *
     * @param rootUri 指定路径
     * @returns
     */
    public static async detachSanguoshaType(rootUri: Uri): Promise<'qSanguosha' | 'noname' | undefined> {

        try {
            // 判断是否存在 .\extensions 目录
            if (await FileSystemHelper.uriExists(Uri.joinPath(rootUri, 'extensions'), FileType.Directory)) {

                // 判断 .\extensions 文件夹是否存在 *.lua 文件
                const extensionsTuples = await workspace.fs.readDirectory(Uri.joinPath(rootUri, 'extensions'));
                if (extensionsTuples.filter((item => item[1] === FileType.File && path.extname(item[0]).toLowerCase() === ".lua")).length > 0) {

                    // .\extensions 文件夹存在 lua 文件，是太阳神三国杀
                    return 'qSanguosha';
                } else {

                    // 判断是否存在 .\lua\ai 目录
                    if (await FileSystemHelper.uriExists(Uri.joinPath(rootUri, 'lua', 'ai'), FileType.Directory)) {

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
                if (await FileSystemHelper.uriExists(Uri.joinPath(rootUri, 'extension.js'), FileType.File)) {
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

    public static async showSanguoshaTypeQuickPicker() {
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
}
