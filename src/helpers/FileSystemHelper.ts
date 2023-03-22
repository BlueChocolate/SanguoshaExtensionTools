import { workspace, Uri, FileType } from "vscode";

export class FileSystemHelper {

    protected constructor() { }
    
    public static async uriExists(uri: Uri, type?: FileType): Promise<boolean> {
        // 调用 stat 方法来判断 uri 是否存在
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