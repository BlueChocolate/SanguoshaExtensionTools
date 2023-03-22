import { LuaAstHelper } from "../helpers/LuaAstHelper";
import { Package } from "./Package";
import { General } from "./General";
import { ConfigurationTarget, extensions, FileType, l10n, Uri, window, workspace } from "vscode";
import { Ai } from "./Ai";
import path = require("path");
import { LogHelper } from "../helpers/LogHelper";
import { FileSystemHelper } from "../helpers/FileSystemHelper";

export abstract class Sanguosha {

  public packages: Package[] = [];


  public abstract readRaw(raw: string): void;
  public abstract load(uri: Uri): void;

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
  public static async createExtensionStructure(uri: Uri, trsName: string) {

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
  public static getGeneralAvatarByName() {
  }

  public static getGeneralCardByName() {
  }

  public static getAvatarByName() {
  }

  public static sanguosha: Sanguosha;


  public static async detachSanguoshaType(rootUri: Uri): Promise<'qSanguosha' | 'noname' | 'freeKill' | undefined> {



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
}

export class SunGod extends Sanguosha {

  public createExtensionStructure(uri: Uri, trsName: string): void {
    throw new Error("Method not implemented.");
  }

  public async load(uri: Uri): Promise<SunGod> {
    const uriExtensions = Uri.joinPath(uri, 'extensions');
    const uriLuaAi = Uri.joinPath(uri, 'lua', 'ai');

    try {
      if (await FileSystemHelper.uriExists(uriExtensions)) {
        const entries = await workspace.fs.readDirectory(uriExtensions);
        const luaFiles = entries.filter(([name, type]) => type === FileType.File && name.toLowerCase().endsWith(".lua")).map(([name]) => Uri.joinPath(uriExtensions, name));
        for (const luaFile of luaFiles) {
          LogHelper.log(l10n.t('Reading ${luaFilePath}', { luaFilePath: luaFile.path }), 'info');
          const luaData = await workspace.fs.readFile(luaFile);
          // 使用Buffer.from或其他方法将Uint8Array转换为字符串，并返回
          const luaText = Buffer.from(luaData).toString();
          this.readRaw(luaText);
        }
      }

    } catch (error) {
    }
    return this;
  }

  public readRaw(raw: string): void {
    let currentPackage: Package;
    try {
      const ast = LuaAstHelper.parse(raw);
      this.readExtensionLua(ast,);
      console.log(this.packages);

      // rebuildTree(ast, function (node: any) {
      //   delete node['loc'];
      // }); // 遍历语法树
      // astToSource(-1, ast, "");
      // console.log(astToSourceResult);
    } catch (error) {
      console.error(error);
    }
  }



  private readExtensionLua(ast: any) {

    switch (Object.prototype.toString.call(ast)) {

      // 访问到数组
      case '[object Array]':
        // 在这里 key 是 0,1,2...
        for (const key in ast) {
          // 判断属性是不是自己定义的，可以排除类似 toString() 之类的东西
          if (Object.prototype.hasOwnProperty.call(ast, key)) {
            this.readExtensionLua(ast[key]);
          }
        } break;

      // 访问到对象
      case '[object Object]':
        switch (ast['type']) {
          case 'LocalStatement':
          case 'AssignmentStatement':

            // NOTE 读取扩展包赋值语句
            // Dominion=sgs.Package("dominion")
            const packageInfo = tryReadSgsPackage(ast);
            if (packageInfo) {
              // 排除重复扩展包名
              if (this.packages.every(pack => pack.trsName !== packageInfo.pack.trsName)) {
                this.packages.push(packageInfo.pack);
              }
            }

            // NOTE 读取武将赋值语句
            // Rem=sgs.General(Dominion,"Rem","magic",3,false)
            const generalInfo = tryReadSgsGeneral(ast);
            if (generalInfo) {
              let generalPackage = this.packages.find(pack => pack.varName === generalInfo.general.packageVarName);
              if (generalPackage) {
                generalPackage.generals.push(generalInfo.general);
              }
            }
            this.readExtensionLua(ast['variables']);
            this.readExtensionLua(ast['init']);
            break;
          case 'UnaryExpression':
            this.readExtensionLua(ast['argument']);
            break;
          case 'BinaryExpression':
          case 'LogicalExpression':
            this.readExtensionLua(ast['left']);
            this.readExtensionLua(ast['right']);
            break;
          case 'FunctionDeclaration':
            this.readExtensionLua(ast['identifier']);
            this.readExtensionLua(ast['parameters']);
            this.readExtensionLua(ast['body']);
            break;
          case 'ForGenericStatement':
            this.readExtensionLua(ast['variables']);
            this.readExtensionLua(ast['iterators']);
            this.readExtensionLua(ast['body']);
            break;
          case 'IfClause':
          case 'ElseifClause':
          case 'WhileStatement':
          case 'RepeatStatement':
            this.readExtensionLua(ast['condition']);
          /* fall through */
          case 'Chunk':
          case 'ElseClause':
          case 'DoStatement':
            this.readExtensionLua(ast['body']);
            this.readExtensionLua(ast['globals']);
            this.readExtensionLua(ast['comments']);
            break;
          case 'ForNumericStatement':
            this.readExtensionLua(ast['variable']);
            this.readExtensionLua(ast['start']);
            this.readExtensionLua(ast['end']);
            this.readExtensionLua(ast['step']);
            this.readExtensionLua(ast['body']);
            break;
          case 'ReturnStatement':
            this.readExtensionLua(ast['arguments']);
            break;
          case 'IfStatement':
            this.readExtensionLua(ast['clauses']);
            break;
          case 'MemberExpression':
            this.readExtensionLua(ast['base']);
            this.readExtensionLua(ast['identifier']);
            break;
          case 'IndexExpression':
            this.readExtensionLua(ast['base']);
            this.readExtensionLua(ast['index']);
            break;
          case 'LabelStatement':
            this.readExtensionLua(ast['label']);
            break;
          case 'CallStatement':
            this.readExtensionLua(ast['expression']);
            break;
          case 'GotoStatement':
            this.readExtensionLua(ast['label']);
            break;
          case 'TableConstructorExpression':
            this.readExtensionLua(ast['fields']);
            break;
          case 'TableKey':
          case 'TableKeyString':
            this.readExtensionLua(ast['key']);
          /* fall through 贯穿执行 */
          case 'TableValue':
            this.readExtensionLua(ast['value']);
            break;
          case 'CallExpression':
            this.readExtensionLua(ast['base']);
            this.readExtensionLua(ast['arguments']);
            break;
          case 'TableCallExpression':

            // NOTE 读取翻译表调用语句
            // sgs.LoadTranslationTable
            let translationInfo = tryReadTranslation(ast);
            if (translationInfo) {
              this.packages[this.packages.length - 1].translations = [...this.packages[this.packages.length - 1].translations, ...translationInfo.translations];
            }
            this.readExtensionLua(ast['arguments']);
          /* fall through */
          case 'StringCallExpression':
            this.readExtensionLua(ast['base']);
            this.readExtensionLua(ast['argument']);
            break;
          case 'Identifier':
          case 'NumericLiteral':
          case 'BooleanLiteral':
          case 'StringLiteral':
          case 'NilLiteral':
          case 'VarargLiteral':
          case 'BreakStatement':
          case 'Comment':
            break;
          default:
            throw new Error('Unhandled ' + ast['type']);
        }
        break;
      default:
        break;
    }

    function tryReadSgsPackage(ast: any) {
      let pack = new Package();

      let isReadSuccess: boolean = false;
      try {
        // 尝试读取一个赋值语句 Dominion=sgs.Package("dominion")
        let assignment = LuaAstHelper.readAssignmentStatement(ast);
        if (assignment) {
          for (const assignation of assignment.assignations) {
            // 尝试读取一个sgs函数调用语句 sgs.Package("dominion")
            let sgsFunction = LuaAstHelper.readSgsCallExpression(assignation.from);
            if (sgsFunction) {
              // 判断函数名是否为 sgs.Package
              if (sgsFunction.name === 'Package') {

                // 尝试读取这个赋值语句的变量名 Dominion
                let identifier = LuaAstHelper.readIdentifier(assignation.to);
                if (identifier) {
                  pack.varName = identifier.name;

                  // 获取函数的参数 GeneralPack CardPack SpecialPack
                  let args = sgsFunction.args;
                  switch (args.length) {
                    case 2:
                      // 判断参数2是不是成员表达式 sgs.Package_GeneralPack
                      let arg2 = LuaAstHelper.readSgsMemberExpression(args[2 - 1]);
                      if (arg2) {
                        switch (arg2.name) {
                          case 'Package_GeneralPack':
                            pack.type = 'generalPack';
                            break;
                          case 'Package_CardPack':
                            pack.type = 'cardPack';
                            break;
                          case 'Package_SpecialPack':
                            pack.type = 'specialPack';
                            break;
                          default:
                            break;
                        }

                      } else { break; }
                    case 1:
                      // 判断参数1是不是字符串 "dominion"
                      let arg1 = LuaAstHelper.readStringLiteral(args[1 - 1]);
                      if (arg1) {
                        pack.trsName = arg1.raw.slice(1, -1); // 去除引号
                      } else { break; }
                      isReadSuccess = true;
                      break;
                    default:

                      console.error("sgs.Package 函数参数数量错误！");
                      break;
                  }
                }
              }
            }
          }
        }

        if (isReadSuccess) {
          return {
            pack: pack,
            range: [0, 1]
          };
        } else { return undefined; }
      } catch (error) {
        console.error(error);
      }
    }

    function tryReadSgsGeneral(ast: any) {
      let general = new General();

      let isReadSuccess: boolean = false;
      try {
        // 尝试读取一个赋值语句 realsubaru=sgs.General(Dominion,"realsubaru","magic",3,true,true)
        let assignment = LuaAstHelper.readAssignmentStatement(ast);
        if (assignment) {
          for (const assignation of assignment.assignations) {
            // 尝试读取一个sgs函数调用语句
            let sgsFunction = LuaAstHelper.readSgsCallExpression(assignation.from);
            if (sgsFunction) {
              // ！判断函数名是否为 sgs.General
              if (sgsFunction.name === 'General') {
                // 赋值语句的位置
                general.loc = assignment.loc;

                // 尝试读取这个赋值语句的变量名 realsubaru
                let identifier = LuaAstHelper.readIdentifier(assignation.to);
                if (identifier) {
                  general.varName = identifier.name;

                  // 获取 sgs.General 函数的参数
                  let args = sgsFunction.args;
                  switch (args.length) {
                    case 8:
                    case 7:
                      let arg7 = LuaAstHelper.readBooleanLiteral(args[7 - 1]);
                      if (arg7) {
                        general.isNeverShown = arg7.raw;
                      } else { break; }
                    case 6:
                      let arg6 = LuaAstHelper.readBooleanLiteral(args[6 - 1]);
                      if (arg6) {
                        general.isHidden = arg6.raw;
                      } else { break; }
                    case 5:
                      let arg5 = LuaAstHelper.readBooleanLiteral(args[5 - 1]);
                      if (arg5) {
                        general.isMale = arg5.raw;
                      } else { break; }
                    case 4:
                      let arg4 = LuaAstHelper.readNumericLiteral(args[4 - 1]);
                      let arg3 = LuaAstHelper.readStringLiteral(args[3 - 1]);
                      let arg2 = LuaAstHelper.readStringLiteral(args[2 - 1]);
                      let arg1 = LuaAstHelper.readIdentifier(args[1 - 1]);
                      if (arg4 && arg3 && arg2 && arg1) {
                        general.hp = arg4.raw;
                        general.kingdom = arg3.raw.slice(1, -1); // 去除引号
                        general.trsName = arg2.raw.slice(1, -1); // 去除引号
                        general.packageVarName = arg1.name;
                      } else { break; }
                      isReadSuccess = true;
                      break;
                    default:
                      console.error("sgs.Package 函数参数数量错误！");
                      break;
                  }
                }
              }
            }
          }
        }

        if (isReadSuccess) {
          return {
            general: general,
            range: []
          };
        } else { return undefined; }
      } catch (error) {
        console.error(error);
      }
    }

    function tryReadSkill(ast: any) {

      return false;
    }

    function tryReadTranslation(ast: any) {
      let translations = [];

      let isReadSuccess: boolean = false;
      try {
        let sgsTable = LuaAstHelper.readSgsTableCallExpression(ast);
        if (sgsTable) {
          if (sgsTable.name === 'LoadTranslationTable') {
            for (const arg of sgsTable.args) {
              let tableKey = LuaAstHelper.readTableKeyOrTableKeyString(arg);
              if (tableKey) {
                let key = LuaAstHelper.readStringLiteral(tableKey.key);
                let value = LuaAstHelper.readStringLiteral(tableKey.value);
                if (key && value) {
                  translations.push({ key: key.raw.slice(1, -1), value: value.raw.slice(1, -1) }); // 去除引号
                }
              }
            }
            // 读到 LoadTranslationTable 就算成功
            isReadSuccess = true;
          }
        }
        if (isReadSuccess) {
          return {
            translations: translations,
            range: ast['range']
          };
        } else { return undefined; }
      } catch (error) {
        console.error(error);
      }
      return undefined;
    }

    function tryReadCard(ast: any) {
      return false;
    }

    function tryReadAi(ast: any) {
      return false;
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

export class NoName extends Sanguosha {
  public readRaw(raw: string): void {
    throw new Error("Method not implemented.");
  }
  public load(uri: Uri): void {
    throw new Error("Method not implemented.");
  }
  public createExtensionStructure(uri: Uri, trsName: string): void {
    throw new Error("Method not implemented.");
  }

}

export class FreeKill extends Sanguosha {
  public readRaw(raw: string): void {
    throw new Error("Method not implemented.");
  }
  public load(uri: Uri): void {
    throw new Error("Method not implemented.");
  }
  public createExtensionStructure(uri: Uri, trsName: string): void {
    throw new Error("Method not implemented.");
  }

}