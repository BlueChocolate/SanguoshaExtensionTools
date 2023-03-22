import { Ai } from "./Ai";
import { Card } from "./Card";
import { General } from "./General";


export class Package {
  constructor() { }
  public type: 'generalPack' | 'cardPack' | 'specialPack' = 'generalPack';
  public trsName: string = '';
  public varName: string = '';
  public generals: General[] = [];
  public cards: Card[] = [];
  public ai: Ai[] = [];
  public uri: string = '';
  public translations: { key: string; value: string; }[] = [];
  public getTranslation(key: string) {
    let value = this.translations.find(item => item.key === key)?.value;
    return value ? value : key;
  }
}

export class GeneralPack extends Package {
  public generals: General[] = [];
}

export class CardPack extends Package {
  public cards: Card[] = [];
}