import { styleArtPaths } from './styleArt';
import { scoreLabels, type ProfileCardModel } from './model';
/** Self-contained canvas: no remote images/secrets, no CORS-tainted PNG exports.
 * This exact canvas is both the visible share preview and downloadable image. */
export function renderShareCard(
  canvas: HTMLCanvasElement,
  model: ProfileCardModel,
  format: 'portrait' | 'landscape' = 'portrait',
) {
  if (format === 'landscape') return renderLandscape(canvas, model);
  canvas.width = 900;
  canvas.height = 1500;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('이 브라우저에서는 카드 이미지를 만들 수 없습니다.');
  const { accent, secondary } = model.theme;
  const text = (s: string, x: number, y: number, size = 24, color = '#eaf0fa', max = 748) => {
    c.fillStyle = color;
    c.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    c.fillText(s, x, y, max);
  };
  const line = (y: number) => {
    c.fillStyle = accent + '44';
    c.fillRect(65, y, 770, 1);
  };
  const gradient = c.createLinearGradient(0, 0, 900, 1500);
  gradient.addColorStop(0, model.art.backdrop);
  gradient.addColorStop(0.6, '#101726');
  gradient.addColorStop(1, '#222035');
  c.fillStyle = gradient;
  c.fillRect(0, 0, 900, 1500);
  const frame = c.createLinearGradient(0, 0, 900, 1500);
  frame.addColorStop(0, accent);
  frame.addColorStop(0.5, secondary);
  frame.addColorStop(1, accent);
  c.strokeStyle = frame;
  c.lineWidth = 8;
  c.strokeRect(18, 18, 864, 1464);
  c.lineWidth = 1;
  c.strokeRect(32, 32, 836, 1436);
  text('TFT / PLAYER ARCHIVE', 65, 82, 19, accent);
  text(model.edition, 590, 82, 17, accent, 240);
  text(model.name, 65, 150, 43, '#ffffff', 750);
  text(model.tag, 65, 186, 22, '#abbcd2');
  // Shared vector scene used by the main SVG card: no network/CORS dependencies.
  c.save();
  c.translate(65, 220);
  c.scale(770 / 600, 770 / 600);
  for (const layer of styleArtPaths(model.art)) {
    const path = new Path2D(layer.d);
    c.globalAlpha = layer.opacity;
    if (layer.fill !== 'none') {
      c.fillStyle = layer.fill;
      c.fill(path);
    }
    if (layer.stroke) {
      c.strokeStyle = layer.stroke;
      c.lineWidth = 1.6;
      c.stroke(path);
    }
  }
  c.restore();
  c.textAlign = 'center';
  text(model.art.illustrationTheme, 450, 556, 19, model.art.color);
  text(`${model.rank}  /  ${model.lp} LP`, 450, 596, 25, accent);
  text('「' + model.profile.name + '」', 450, 646, 34, model.art.color, 740);
  text(
    model.profile.tags.join('  ·  ') || '성향 태그는 표본 확보 후 표시',
    450,
    686,
    19,
    '#c5d1e1',
  );
  text(model.sample, 450, 728, 18, '#a8b7cd');
  c.textAlign = 'left';
  c.save();
  c.translate(0, 220);
  line(540);
  model.stats.forEach((s, i) => {
    const x = 80 + i * 260;
    text(s.label, x, 580, 18, '#a8b7cd');
    text(s.value, x, 625, 37);
  });
  line(650);
  text('PLAY DNA / 자체 분석', 65, 689, 18, accent);
  Object.entries(scoreLabels).forEach(([key, label], i) => {
    const x = 65 + (i % 2) * 398,
      y = 732 + Math.floor(i / 2) * 55;
    const score = model.scores?.[key as keyof typeof scoreLabels];
    text(label, x, y, 20);
    text(String(score ?? '—'), x + 304, y, 24, accent, 60);
    c.fillStyle = '#334055';
    c.fillRect(x, y + 12, 348, 4);
    if (score != null) {
      c.fillStyle = accent;
      c.fillRect(x, y + 12, (348 * score) / 100, 4);
    }
  });
  line(929);
  text('선호 챔피언 TOP 3', 65, 966, 18, accent);
  text(
    model.units.map((r) => r.name + (r.enough ? '' : '*')).join(' · ') || '기록 부족',
    65,
    1000,
    23,
  );
  text('선호 활성 특성 TOP 3', 65, 1037, 18, accent);
  text(
    model.traits.map((r) => r.name + (r.enough ? '' : '*')).join(' · ') || '기록 부족',
    65,
    1071,
    23,
  );
  const comment = model.profile.comment;
  const wrap = (size: number) => {
    c.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    const rows: string[] = [];
    let row = '';
    for (const character of comment) {
      if (c.measureText(row + character).width > 750) {
        rows.push(row);
        row = '';
      }
      row += character;
    }
    if (row) rows.push(row);
    return rows;
  };
  let size = 20,
    rows = wrap(size);
  while (rows.length * (size + 5) > 90 && size > 12) {
    size--;
    rows = wrap(size);
  }
  rows.forEach((row, i) => text(row, 65, 1110 + i * (size + 5), size, '#c6d1e1'));
  text('TFT PROFILE ANALYZER  ·  자체 지표 / * 표본 부족', 65, 1230, 16, '#a8b7cd');
  c.restore();
}

/** 1200×630 community card. Only measured data, no invented profile level. */
function renderLandscape(canvas: HTMLCanvasElement, model: ProfileCardModel) {
  canvas.width = 1200;
  canvas.height = 630;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('카드 이미지를 만들 수 없습니다.');
  const text = (s: string, x: number, y: number, size = 20, color = '#e8effa', max = 1050) => {
    c.fillStyle = color;
    c.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    c.fillText(s, x, y, max);
  };
  c.fillStyle = '#101824';
  c.fillRect(0, 0, 1200, 630);
  c.strokeStyle = model.theme.accent;
  c.lineWidth = 3;
  c.strokeRect(10, 10, 1180, 610);
  c.save();
  c.translate(20, 104);
  c.scale(0.65, 0.65);
  for (const p of styleArtPaths(model.art)) {
    const shape = new Path2D(p.d);
    c.globalAlpha = p.opacity;
    if (p.fill !== 'none') {
      c.fillStyle = p.fill;
      c.fill(shape);
    }
    if (p.stroke) {
      c.strokeStyle = p.stroke;
      c.lineWidth = 1.6;
      c.stroke(shape);
    }
  }
  c.restore();
  text('TFT PROFILE / ' + model.edition, 38, 48, 16, model.theme.accent);
  text(model.name + ' ' + model.tag, 38, 90, 30, '#fff', 1110);
  text(model.rank + ' · ' + model.lp + ' LP', 40, 284, 20, model.theme.accent, 350);
  text(model.profile.name, 40, 325, 28, model.art.color, 350);
  text(model.profile.tags.join(' · ') || '분석 표본 부족', 40, 360, 15, '#c1cee0', 350);
  text(model.sample, 40, 395, 17, '#b2c1d8', 350);
  text('평균 최종 레벨 ' + (model.averageLevel?.toFixed(1) ?? '—'), 40, 427, 17, '#b2c1d8', 350);
  model.stats.forEach((s, i) => {
    const x = 440 + i * 235;
    text(s.label, x, 157, 18, '#aabcce');
    text(s.value, x, 204, 39, model.art.color, 210);
  });
  Object.entries(scoreLabels).forEach(([key, label], i) => {
    const x = 440 + (i % 4) * 178,
      y = 259 + Math.floor(i / 4) * 59;
    text(label, x, y, 16, '#aabcce', 165);
    text(
      String(model.scores?.[key as keyof typeof scoreLabels] ?? '—'),
      x,
      y + 27,
      23,
      model.art.color,
      165,
    );
  });
  const groups = [
    ['대표 챔피언', model.units],
    ['대표 아이템', model.items],
    ['대표 활성 특성', model.traits],
  ] as const;
  groups.forEach(([label, rows], i) => {
    text(label, 440, 392 + i * 34, 16, '#aabcce', 140);
    text(rows[0]?.name ?? '기록 부족', 590, 392 + i * 34, 20, '#e8effa', 550);
  });
  // Flavor is decorative, while the measured summary remains visible above.
  c.font = '600 16px \"Noto Sans KR\", sans-serif';
  let summary = '',
    summaryY = 497;
  for (const char of model.profile.comment) {
    if (c.measureText(summary + char).width > 1110) {
      text(summary, 40, summaryY, 16, '#d7e1ef', 1110);
      summary = '';
      summaryY += 21;
    }
    summary += char;
  }
  text(summary, 40, summaryY, 16, '#d7e1ef', 1110);
  text('자체 분석 · 최종 보드 기준 / 공식 실력·백분위가 아닙니다', 40, 559, 15, '#98adc5');
  text('tft-profile.pages.dev', 40, 593, 20, model.theme.accent);
  text('기록은 변해도, 나의 플레이는 남는다', 800, 593, 15, '#98adc5', 350);
}
