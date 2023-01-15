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
