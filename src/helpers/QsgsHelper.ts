import { Uri, workspace } from 'vscode';
import { BaseHelper } from './BaseHelper';


export class QsgsHelper extends BaseHelper {

    static async createNewExtension(uri: Uri, trsName: string) {

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

    static getGeneralAvatarByName() {
    }

    static getGeneralCardByName() {
    }

    static getAvatarByName() {
    }


}
