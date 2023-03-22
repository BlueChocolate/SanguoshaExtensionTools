import { Uri } from "vscode";
import { Loc } from "./Loc";

export class General {
  public varName: string = "";
  public packageVarName: string = "";
  public trsName: string = "";
  public kingdom: string = "";
  public hp: number = 0;
  public isMale: boolean = true;
  public isHidden: boolean = false;
  public isNeverShown: boolean = false;
  public hegMaxHp: number = 0; // 啥玩意
  public skills: Skill[] = [];

  public loc?: Loc;
  public uri?: Uri;
}
