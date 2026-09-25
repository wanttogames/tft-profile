import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  topShareScores,
  heroCoverCrop,
  SHARE_LAYOUT,
  shareArtPosition,
} from '../src/profile-card/shareLayout';
import { profileCardModel } from '../src/profile-card/model';
import { demoPlayer } from '../src/data/demo';
it('selects exactly the two highest available DNA values with stable ties', () => {
  const scores = profileCardModel(demoPlayer()).scores!;
  const values = {
    ...scores,
    ceiling: 95,
    stability: 99,
    survival: 12,
    lateGame: 13,
    flexibility: 14,
    diversity: 10,
    completion: null,
    form: 8,
  };
  expect(topShareScores(values).map((s) => s.key)).toEqual(['stability', 'ceiling']);
  expect(topShareScores({ ...values, ceiling: 99 }).map((s) => s.key)).toEqual([
    'ceiling',
    'stability',
  ]);
  expect(topShareScores(null)).toEqual([]);
  expect(topShareScores({ ...values, stability: NaN }).map((s) => s.key)).toEqual([
    'ceiling',
    'flexibility',
  ]);
});
it('reserves 45–50% of a 5:7 card for hero without dependence on detail text', () => {
  expect(SHARE_LAYOUT.width / SHARE_LAYOUT.height).toBe(5 / 7);
  expect(SHARE_LAYOUT.hero.height / SHARE_LAYOUT.height).toBeGreaterThanOrEqual(0.45);
  expect(SHARE_LAYOUT.hero.height / SHARE_LAYOUT.height).toBeLessThanOrEqual(0.5);
});
it.each(['gnar', 'ahri', 'other'])('keeps %s cover crop in source bounds', (champion) => {
  for (const [w, h] of [
    [1086, 1448],
    [1448, 1086],
  ]) {
    const crop = heroCoverCrop(w, h, champion);
    expect(crop.sx).toBeGreaterThanOrEqual(0);
    expect(crop.sy).toBeGreaterThanOrEqual(0);
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(w + 1e-8);
    expect(crop.sy + crop.sh).toBeLessThanOrEqual(h + 1e-8);
  }
  expect(shareArtPosition('gnar').y).toBe(0.35);
  expect(shareArtPosition('ahri').y).toBe(0.25);
  expect(heroCoverCrop(1086, 1448, 'ahri').sy).toBeLessThan(heroCoverCrop(1086, 1448, 'gnar').sy);
});
it('provides a plain ads.txt with matching publisher ID outside API routes', () => {
  expect(readFileSync('public/ads.txt', 'utf8')).toBe(
    'google.com, pub-4341957966658067, DIRECT, f08c47fec0942fa0\n',
  );
  expect(readFileSync('index.html', 'utf8')).toContain('ca-pub-4341957966658067');
  expect(JSON.parse(readFileSync('public/_routes.json', 'utf8')).include).toEqual(['/api/*']);
});
