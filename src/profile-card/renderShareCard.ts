import { styleArtPaths } from './styleArt';
import { scoreLabels, type ProfileCardModel } from './model';
/** Self-contained canvas: no remote images/secrets, no CORS-tainted PNG exports.
 * This exact canvas is both the visible share preview and downloadable image. */
export function renderShareCard(canvas: HTMLCanvasElement, model: ProfileCardModel) {
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
