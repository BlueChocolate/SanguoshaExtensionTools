import { FileType, Uri, workspace } from 'vscode';
import { BaseHelper } from './BaseHelper';
import { LogHelper } from './LogHelper';


export class FileSystemHelper extends BaseHelper {

    

    public static async uriExists(uri: Uri, type?: FileType): Promise<boolean> {
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
}
