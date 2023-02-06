import { LuaAstHelper } from "../helpers/LuaAstHelper";
import { Package } from "./Package";
import { General } from "./General";
import { ConfigurationTarget, FileType, l10n, Uri, window, workspace } from "vscode";
import { Ai } from "./Ai";

export abstract class Sanguosha {

  public type: 'qSanguosha' | 'noname' | 'freeKill' = 'qSanguosha';
  public packages: Package[] = [];
  public ai: Ai[] = [];
  public translations: { key: string; value: string; }[] = [];

  public getTranslation(key: string) {
    let value = this.translations.find(item => item.key === key)?.value;
    return value ? value : key;
  }

  readQsgsRaw(luaRaw: string) {
    let astToSourceResult: string = "";
    try {
      const ast = LuaAstHelper.parse(luaRaw);
      this.readExtensionInfo(ast);


      console.log(this.packages);
      console.log(this.translations);

      // rebuildTree(ast, function (node: any) {
      //   delete node['loc'];
      // }); // 遍历语法树
      // astToSource(-1, ast, "");
      // console.log(astToSourceResult);
    } catch (error) {
      console.error(error);
    }
  }

  readExtensionInfo(ast: any) {
    switch (Object.prototype.toString.call(ast)) {

      // 访问到数组
      case '[object Array]':
        // 在这里 key 是 0,1,2...
        for (const key in ast) {
          // 判断属性是不是自己定义的，可以排除类似 toString() 之类的东西
          if (Object.prototype.hasOwnProperty.call(ast, key)) {
            this.readExtensionInfo(ast[key]);
          }
        } break;

      // 访问到对象
      case '[object Object]':
        switch (ast['type']) {
          case 'LocalStatement':
          case 'AssignmentStatement':

            // NOTE 读取扩展包赋值语句
            // Dominion=sgs.Package("dominion")
            const packageInfo = tryReadPackage(ast);
            if (packageInfo) {
              // 如果数组列表不存在
              if (this.packages.every(pack => pack.trsName !== packageInfo.pack.trsName)) {
                this.packages.push(packageInfo.pack);
              }
            }

            // NOTE 读取武将赋值语句
            // Rem=sgs.General(Dominion,"Rem","magic",3,false)
            const generalInfo = tryReadGeneral(ast);
            if (generalInfo) {
              let currentPackage = this.packages.find(pack => pack.varName === generalInfo.general.packageVarName);
              if (currentPackage) {
                currentPackage.generals.push(generalInfo.general);
              }
            }
            // if (tryReadGeneral(ast)) { return; }
            this.readExtensionInfo(ast['variables']);
            this.readExtensionInfo(ast['init']);
            break;
          case 'UnaryExpression':
            this.readExtensionInfo(ast['argument']);
            break;
          case 'BinaryExpression':
          case 'LogicalExpression':
            this.readExtensionInfo(ast['left']);
            this.readExtensionInfo(ast['right']);
            break;
          case 'FunctionDeclaration':
            this.readExtensionInfo(ast['identifier']);
            this.readExtensionInfo(ast['parameters']);
            this.readExtensionInfo(ast['body']);
            break;
          case 'ForGenericStatement':
            this.readExtensionInfo(ast['variables']);
            this.readExtensionInfo(ast['iterators']);
            this.readExtensionInfo(ast['body']);
            break;
          case 'IfClause':
          case 'ElseifClause':
          case 'WhileStatement':
          case 'RepeatStatement':
            this.readExtensionInfo(ast['condition']);
          /* fall through */
          case 'Chunk':
          case 'ElseClause':
          case 'DoStatement':
            this.readExtensionInfo(ast['body']);
            this.readExtensionInfo(ast['globals']);
            this.readExtensionInfo(ast['comments']);
            break;
          case 'ForNumericStatement':
            this.readExtensionInfo(ast['variable']);
            this.readExtensionInfo(ast['start']);
            this.readExtensionInfo(ast['end']);
            this.readExtensionInfo(ast['step']);
            this.readExtensionInfo(ast['body']);
            break;
          case 'ReturnStatement':
            this.readExtensionInfo(ast['arguments']);
            break;
          case 'IfStatement':
            this.readExtensionInfo(ast['clauses']);
            break;
          case 'MemberExpression':
            this.readExtensionInfo(ast['base']);
            this.readExtensionInfo(ast['identifier']);
            break;
          case 'IndexExpression':
            this.readExtensionInfo(ast['base']);
            this.readExtensionInfo(ast['index']);
            break;
          case 'LabelStatement':
            this.readExtensionInfo(ast['label']);
            break;
          case 'CallStatement':
            this.readExtensionInfo(ast['expression']);
            break;
          case 'GotoStatement':
            this.readExtensionInfo(ast['label']);
            break;
          case 'TableConstructorExpression':
            this.readExtensionInfo(ast['fields']);
            break;
          case 'TableKey':
          case 'TableKeyString':
            this.readExtensionInfo(ast['key']);
          /* fall through */
          case 'TableValue':
            this.readExtensionInfo(ast['value']);
            break;
          case 'CallExpression':
            this.readExtensionInfo(ast['base']);
            this.readExtensionInfo(ast['arguments']);
            break;
          case 'TableCallExpression':

            // NOTE 读取翻译表调用语句
            let translationInfo = tryReadTranslation(ast);
            if (translationInfo) {
              this.translations = [...this.translations, ...translationInfo.translations];
            }
            this.readExtensionInfo(ast['arguments']);
          /* fall through */
          case 'StringCallExpression':
            this.readExtensionInfo(ast['base']);
            this.readExtensionInfo(ast['argument']);
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

    function tryReadPackage(ast: any) {
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

                  // 获取函数的参数
                  // GeneralPack CardPack SpecialPack
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

    function tryReadGeneral(ast: any) {
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

  readNonameRaw() {
    throw new Error(l10n.t('Function not implemented.'));
  }

  abstract readRaw(): void;
  abstract load(): void;

  static getGeneralAvatarByName() {
  }

  static getGeneralCardByName() {
  }

  static getAvatarByName() {
  }

  

}

export class QSanguosha extends Sanguosha {
  load(): void {
    throw new Error("Method not implemented.");
  }
  readRaw(): void {
    throw new Error(l10n.t('Method not implemented.'));
  }
}