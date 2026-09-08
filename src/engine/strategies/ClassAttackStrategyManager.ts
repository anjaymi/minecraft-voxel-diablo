import { CharacterClassId } from '../../types';
import { IClassAttackStrategy } from './ClassAttackStrategy';
import { WarriorAttackStrategy } from './WarriorAttackStrategy';
import { MageAttackStrategy } from './MageAttackStrategy';
import { RangerAttackStrategy } from './RangerAttackStrategy';
import { RogueAttackStrategy } from './RogueAttackStrategy';
import { SummonerAttackStrategy } from './SummonerAttackStrategy';
import { DruidAttackStrategy } from './DruidAttackStrategy';

export class ClassAttackStrategyManager {
  private static instance: ClassAttackStrategyManager;
  private strategies: Map<CharacterClassId, IClassAttackStrategy> = new Map();

  private constructor() {
    this.registerDefaultStrategies();
  }

  public static getInstance(): ClassAttackStrategyManager {
    if (!ClassAttackStrategyManager.instance) {
      ClassAttackStrategyManager.instance = new ClassAttackStrategyManager();
    }
    return ClassAttackStrategyManager.instance;
  }

  private registerDefaultStrategies() {
    this.strategies.set('warrior', new WarriorAttackStrategy());
    this.strategies.set('mage', new MageAttackStrategy());
    this.strategies.set('ranger', new RangerAttackStrategy());
    this.strategies.set('rogue', new RogueAttackStrategy());
    this.strategies.set('summoner', new SummonerAttackStrategy());
    this.strategies.set('druid', new DruidAttackStrategy());
  }

  public getStrategy(classId: CharacterClassId): IClassAttackStrategy {
    const strat = this.strategies.get(classId);
    if (!strat) {
      return this.strategies.get('warrior')!;
    }
    return strat;
  }

  public registerStrategy(classId: CharacterClassId, strategy: IClassAttackStrategy) {
    this.strategies.set(classId, strategy);
  }
}

export const classAttackStrategyManager = ClassAttackStrategyManager.getInstance();
