import { Item } from '../../types';

export interface GoodSmileArmorPalette {
  armorColor: string;
  trimColor: string;
  specularColor: string;
}

export interface GoodSmileBootPalette {
  bootColor: string;
  bootTrim: string;
}

export interface GoodSmileFullPalette extends GoodSmileArmorPalette, GoodSmileBootPalette {}

export class GoodSmileColorUtils {
  public static getArmorColors(armor?: Item): GoodSmileArmorPalette {
    let armorColor = '#06b6d4';
    let trimColor = '#0891b2';
    let specularColor = 'rgba(255, 255, 255, 0.25)';

    if (armor) {
      const aName = armor.name;
      if (aName.includes('Netherite') || aName.includes('下界')) {
        armorColor = '#1e1b4b';
        trimColor = '#4338ca';
        specularColor = 'rgba(129, 140, 248, 0.35)';
      } else if (aName.includes('Diamond') || aName.includes('钻石')) {
        armorColor = '#06b6d4';
        trimColor = '#67e8f9';
        specularColor = 'rgba(255, 255, 255, 0.40)';
      } else if (aName.includes('Gold') || aName.includes('金')) {
        armorColor = '#f59e0b';
        trimColor = '#fef08a';
        specularColor = 'rgba(254, 240, 138, 0.45)';
      } else if (aName.includes('Iron') || aName.includes('铁')) {
        armorColor = '#cbd5e1';
        trimColor = '#94a3b8';
        specularColor = 'rgba(255, 255, 255, 0.45)';
      } else if (aName.includes('Leather') || aName.includes('皮')) {
        armorColor = '#92400e';
        trimColor = '#78350f';
        specularColor = 'rgba(254, 215, 170, 0.25)';
      }
    }

    return { armorColor, trimColor, specularColor };
  }

  public static getBootColors(boots?: Item): GoodSmileBootPalette {
    let bootColor = '#1e3a8a';
    let bootTrim = '#0f172a';

    if (boots) {
      const bName = boots.name;
      if (bName.includes('Netherite') || bName.includes('下界')) {
        bootColor = '#312e81';
        bootTrim = '#1e1b4b';
      } else if (bName.includes('Diamond') || bName.includes('钻石')) {
        bootColor = '#06b6d4';
        bootTrim = '#0891b2';
      } else if (bName.includes('Gold') || bName.includes('金')) {
        bootColor = '#f59e0b';
        bootTrim = '#d97706';
      } else if (bName.includes('Iron') || bName.includes('铁')) {
        bootColor = '#cbd5e1';
        bootTrim = '#94a3b8';
      } else if (bName.includes('Leather') || bName.includes('皮')) {
        bootColor = '#78350f';
        bootTrim = '#451a03';
      }
    }

    return { bootColor, bootTrim };
  }

  public static getFullPalette(armor?: Item, boots?: Item): GoodSmileFullPalette {
    return {
      ...this.getArmorColors(armor),
      ...this.getBootColors(boots),
    };
  }
}
