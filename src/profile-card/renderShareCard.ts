import { styleArtPaths } from './styleArt';
import type { ProfileCardModel } from './model';
import { SHARE_LAYOUT, heroCoverCrop, topShareScores } from './shareLayout';
/** Dedicated collectible export. Never lays out the detailed profile component.
 * Hero bounds are fixed at 55% of total height regardless of text or missing data. */
export function renderShareCard(
  canvas: HTMLCanvasElement,
  model: ProfileCardModel,
  artwork?: HTMLImageElement | null,
) {
  canvas.width = SHARE_LAYOUT.width;
  canvas.height = SHARE_LAYOUT.height;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('이 브라우저에서는 카드 이미지를 만들 수 없습니다.');
  const { accent, secondary } = model.theme;
  const text = (s: string, x: number, y: number, size = 26, color = '#eaf2ff', max = 930) => {
    c.fillStyle = color;
    c.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    c.fillText(s, x, y, max);
  };
  c.fillStyle = '#0a1220';
  c.fillRect(0, 0, canvas.width, canvas.height);
  const hero = SHARE_LAYOUT.hero;
  if (artwork) {
    const crop = heroCoverCrop(
      artwork.naturalWidth,
      artwork.naturalHeight,
      model.artwork.championKey,
    );
    c.drawImage(
      artwork,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      hero.x,
      hero.y,
      hero.width,
      hero.height,
    );
  } else {
    c.save();
    c.translate(hero.x, hero.y + hero.height / 2 - hero.width / 5);
    c.scale(hero.width / 600, hero.width / 600);
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
  }
  const vignette = c.createRadialGradient(540, 540, 100, 540, 540, 640);
  vignette.addColorStop(0, '#0a122000');
  vignette.addColorStop(0.65, '#0a12200a');
  vignette.addColorStop(1, '#0a1220bb');
  c.fillStyle = vignette;
  c.fillRect(hero.x, hero.y, hero.width, hero.height);
  const fade = c.createLinearGradient(0, hero.y, 0, hero.y + hero.height);
  fade.addColorStop(0, '#0a122066');
  fade.addColorStop(0.12, '#0a122000');
  fade.addColorStop(0.78, '#0a122000');
  fade.addColorStop(1, '#0a1220');
  c.fillStyle = fade;
  c.fillRect(hero.x, hero.y, hero.width, hero.height);
  c.strokeStyle = accent;
  c.lineWidth = 4;
  c.strokeRect(18, 18, 1044, 1314);
  c.strokeStyle = secondary;
  c.lineWidth = 1;
  c.strokeRect(27, 27, 1026, 1296);
  drawFrameOrnaments(c, 1080, 1350, accent, secondary);
  text(model.name, 65, 91, 48, '#ffffff', 940);
  text(model.tag, 67, 134, 27, '#b8cce2', 420);
  c.textAlign = 'right';
  text(`${model.rank} / ${model.lp} LP`, 1015, 151, 30, accent, 610);
  c.textAlign = 'center';
  if (model.artwork.name) text(model.artwork.name, 540, 901, 24, '#d9e7f8', 750);
  text('「' + model.profile.name + '」', 540, 981, 43, accent, 930);
  model.stats.forEach((s, i) => {
    const x = 214 + i * 326;
    text(s.label, x, 1048, 24, '#b8cce2', 290);
    text(s.value, x, 1107, 49, '#ffffff', 290);
  });
  c.fillStyle = accent + '44';
  c.fillRect(75, 1140, 930, 1);
  text('PLAY DNA / 자체 분석', 540, 1180, 21, '#afc4dd', 900);
  const scores = topShareScores(model.scores);
  if (!scores.length) text('분석 표본 부족', 540, 1232, 28, '#b8cce2');
  scores.forEach((s, i) =>
    text(
      `${s.label}  ${s.value}`,
      scores.length === 1 ? 540 : 300 + i * 480,
      1232,
      31,
      accent,
      430,
    ),
  );
  text('TFT PROFILE ANALYZER', 540, 1298, 23, accent, 900);
  // Keep synthetic previews visibly labelled without adding real-profile detail sections.
  if (model.edition.startsWith('DEMO')) {
    c.textAlign = 'left';
    text('DEMO · 가상 데이터', 65, 55, 16, '#b8cce2', 400);
  }
  c.textAlign = 'left';
}

function drawFrameOrnaments(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  secondary: string,
) {
  for (const [x, y, sx, sy] of [
    [20, 20, 1, 1],
    [w - 20, 20, -1, 1],
    [20, h - 20, 1, -1],
    [w - 20, h - 20, -1, -1],
  ]) {
    c.save();
    c.translate(x!, y!);
    c.scale(sx!, sy!);
    c.fillStyle = secondary;
    c.strokeStyle = accent;
    c.lineWidth = 2;
    const shape = new Path2D('M0 90V15L15 0H90L53 13H26L13 26V53Z M8 65 19 20 58 5 31 30Z');
    c.fill(shape);
    c.stroke(shape);
    c.restore();
  }
}
