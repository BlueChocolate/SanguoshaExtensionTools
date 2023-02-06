import { Card } from './Card';
import { General } from './General';

export class Package {
  constructor() { }
  public type: 'generalPack' | 'cardPack' | 'specialPack' = 'generalPack';
  public trsName: string = '';
  public varName: string = '';
  public generals: General[] = [];
  public cards: Card[] = [];
}

export class GeneralPack extends Package{
  public generals: General[] = [];
}

export class CardPack extends Package{
  public cards: Card[] = [];
}