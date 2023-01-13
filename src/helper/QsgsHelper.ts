import { Uri, workspace } from 'vscode';
import { BaseHelper } from './BaseHelper';


export class QsgsHelper extends BaseHelper {

    static async createNewExtension(uri: Uri, name: string) {

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

            const writeStr = name.length > 1 ? (name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()) : name.toUpperCase() + ' = sgs.Package("' + name + '")\n\nreturn Dominion';
            const writeData = Buffer.from(writeStr, 'utf-8');

            await workspace.fs.writeFile(Uri.joinPath(uri, 'extensions', name + '.lua'), writeData);
            await workspace.fs.writeFile(Uri.joinPath(uri, 'lua', 'ai', name + '-ai.lua'), new Uint8Array());
        }
    }

    static getGeneralAvatarByName() {
    }

    static getGeneralCardByName() {
    }

    static getAvatarByName() {
    }


}
