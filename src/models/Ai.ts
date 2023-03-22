import { Uri } from "vscode";
import { Loc } from "./Loc";

export class Ai {
    public packageVarName: string = "";
    public type: string = "";
    public skill: string = "";
    
    public loc?: Loc;
    public uri?: Uri;
}