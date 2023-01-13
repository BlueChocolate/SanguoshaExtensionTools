import { Card } from './Card';
import { General } from './General';


export enum PcakageType { generalPack, cardPack, specialPack }
export class Package {
  constructor() { }
  type: PcakageType = PcakageType.generalPack;
  trsName: string | undefined;
  varName: string | undefined;

  generals: General[] = [];
  cards: Card[] = [];
}
