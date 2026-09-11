import type { Game } from '../../types/riot';
import { playerProfile } from '../profileAnalysis';
import { playDna } from './playDna';
import { sample } from './sample';
export function playerClass(input: Game[]) {
  const g = sample(input),
    p = playerProfile(g),
    d = playDna(g);
  const result = (name: string, reason: string) => ({ name, reason });
  if (g.length < 20 || p.units.available < g.length * 0.8 || p.traits.available < g.length * 0.8)
    return result(
      '아직 쓰여지는 캐릭터',
      '성향 분류는 20경기와 80% 이상의 보드·특성 기록이 필요합니다.',
    );
  if (
    p.deckConcentration! >= 0.6 &&
    p.unitConcentration! >= 0.8 &&
    d.stability.value! >= 65 &&
    p.stats.top4! >= 0.6
  )
    return result(
      '안정적인 한 우물 장인',
      '주요 조합 60%·주요 챔피언 80% 이상 반복, TOP4 60% 이상과 안정성 65 이상이 함께 관측됐습니다.',
    );
  if (d.peak.value! >= 40 && p.stats.win! >= 0.2 && p.variance! >= 3)
    return result(
      '고점 폭발형 승부사',
      '폭발력 40 이상·1등 20% 이상이며 등수의 변동도 큰 편입니다.',
    );
  if (
    d.aggression.value! >= 65 &&
    p.damageCount >= g.length * 0.8 &&
    p.eliminatedCount >= g.length * 0.8 &&
    p.stats.top4! >= 0.5
  )
    return result(
      '공격적인 보드 파괴자',
      '피해량·처치 기록이 80% 이상 확보됐으며 공격성 65 이상, TOP4 50% 이상입니다.',
    );
  if (Object.values(d).every((x) => x.value !== null && x.value >= 50) && p.stats.average! <= 4)
    return result('올라운드 전략가', '여섯 능력치가 모두 50 이상이며 평균 4위 이내입니다.');
  if (d.flexibility.value! >= 50 && p.deck.score! >= 45 && p.unitDiversity! >= 40)
    return result(
      '메타 탐험가',
      '최종 유닛과 주요 특성 조합의 다양성이 높습니다. 실제 메타를 추적했다는 뜻은 아닙니다.',
    );
  if (d.survival.value! >= 65 && p.bottom2! <= 0.15 && p.stats.average! <= 4.5)
    return result('끈질긴 생존자', '생존력 65 이상, 7~8위 15% 이하, 평균 4.5위 이내입니다.');
  return result(
    '자신만의 길을 걷는 전략가',
    '여러 지표를 종합했을 때 한 가지 클래스가 뚜렷하게 나타나지 않습니다.',
  );
}
