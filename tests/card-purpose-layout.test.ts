import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import PlayerCard from '../src/components/PlayerCard.vue';
import ShareProfileCard from '../src/components/ShareProfileCard.vue';
import { demoPlayer } from '../src/data/demo';
import { profileCardModel } from '../src/profile-card/model';

describe('separate analysis and collectible layouts', () => {
  it('keeps identity before analysis and favorites after both columns', async () => {
    const data = demoPlayer();
    data.account.gameName = '긴이름ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const html = await renderToString(createSSRApp({ render: () => h(PlayerCard, { data }) }));
    expect(html).toContain(data.account.gameName);
    expect(html.indexOf('card-identity')).toBeLessThan(html.indexOf('card-abilities'));
    expect(html.indexOf('card-abilities')).toBeLessThan(html.indexOf('signature-grid'));
    expect(html.match(/<progress /g)).toHaveLength(8);
  });
  it('uses the export resolution for its canvas preview', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(ShareProfileCard, { model: profileCardModel(demoPlayer()) }),
      }),
    );
    expect(html).toContain('width="1080"');
    expect(html).toContain('height="1512"');
    expect(html).toContain('5:7');
    expect(html).not.toContain('<progress');
  });
});
