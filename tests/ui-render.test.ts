import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import MatchList from '../src/components/MatchList.vue';
import PreferencePanel from '../src/components/PreferencePanel.vue';
import { demoPlayer } from '../src/data/demo';
describe('server-rendered 50-game UI', () => {
  it('renders ten match details initially, without reducing the fifty-game dataset', async () => {
    const data = demoPlayer();
    const html = await renderToString(createSSRApp(MatchList, { data }));
    expect((html.match(/class="match"/g) || []).length).toBe(10);
    expect(html).toContain('더 보기');
    expect(html).toContain('10 / 50경기');
    expect(data.games).toHaveLength(50);
  });
  it('renders the preference table and sample rules using all fifty games', async () => {
    const html = await renderToString(
      createSSRApp(PreferencePanel, { data: demoPlayer(), kind: 'augment' }),
    );
    expect(html).toContain('선호 증강체 TOP 5');
    expect(html).toContain('분석 50경기');
    expect(html).toContain('가상 전투 증강');
    expect(html).toContain('항목별 3회 미만');
  });
});
