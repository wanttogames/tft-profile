import { styleArtPaths } from './styleArt';
import type { ProfileCardModel } from './model';
import { SHARE_LAYOUT, heroCoverCrop, topShareScores } from './shareLayout';
/** Independent 5:7 trading-card export. Hero occupies 47.6% of the canvas.
 * All information below has dedicated bounds; prose cannot resize or clip the artwork. */
export function renderShareCard(
  canvas: HTMLCanvasElement,
  model: ProfileCardModel,
  artwork?: HTMLImageElement | null,
) {
  const { width: w, height: h, hero } = SHARE_LAYOUT;
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) throw Error('이 브라우저에서는 카드 이미지를 만들 수 없습니다.');
  const { accent, secondary } = model.theme;
  // Fit at a readable font size; unusually long strings ellipsize, never distort horizontally.
  const text = (source: string, x: number, y: number, size = 26, color = '#eaf2ff', max = 930) => {
    let value = source,
      fontSize = size;
    const font = () => {
      c.font = `600 ${fontSize}px "Noto Sans KR", sans-serif`;
    };
    font();
    while (fontSize > size * 0.72 && c.measureText(value).width > max) {
      fontSize -= 1;
      font();
    }
    if (c.measureText(value).width > max) {
      const chars = Array.from(value);
      while (chars.length && c.measureText(chars.join('') + '…').width > max) chars.pop();
      value = chars.join('') + '…';
    }
    c.fillStyle = color;
    c.fillText(value, x, y);
  };
  const panel = (x: number, y: number, width: number, height: number) => {
    c.fillStyle = '#0c1c2c';
    c.fillRect(x, y, width, height);
    c.strokeStyle = secondary + '88';
    c.lineWidth = 1;
    c.strokeRect(x, y, width, height);
  };
  c.fillStyle = '#09121e';
  c.fillRect(0, 0, w, h);
  const foil = c.createLinearGradient(0, 0, w, h);
  foil.addColorStop(0, secondary + '55');
  foil.addColorStop(0.45, '#0a122000');
  foil.addColorStop(1, accent + '22');
  c.fillStyle = foil;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = accent;
  c.lineWidth = 4;
  c.strokeRect(20, 20, w - 40, h - 40);
  c.strokeStyle = secondary;
  c.lineWidth = 1;
  c.strokeRect(32, 32, w - 64, h - 64);
  drawFrameOrnaments(c, w, h, accent, secondary);
  // Name bar and tier. No invented player levels or rarity scores.
  panel(58, 48, 964, 138);
  text('TFT / PLAYER ARCHIVE', 78, 77, 17, accent, 440);
  c.textAlign = 'right';
  text(model.edition, 1000, 77, 17, accent, 460);
  c.textAlign = 'left';
  text(model.name, 78, 128, 46, '#ffffff', 916);
  text(model.tag, 78, 165, 25, '#b9cedd', 400);
  c.textAlign = 'right';
  text(`${model.rank} / ${model.lp} LP`, 1000, 165, 25, accent, 490);
  c.textAlign = 'left';
  // Dedicated art window. Cover crop retains champion-specific focal points.
  c.save();
  c.beginPath();
  c.rect(hero.x, hero.y, hero.width, hero.height);
  c.clip();
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
  const vignette = c.createRadialGradient(
    w / 2,
    hero.y + hero.height / 2,
    120,
    w / 2,
    hero.y + hero.height / 2,
    620,
  );
  vignette.addColorStop(0, '#09121e00');
  vignette.addColorStop(0.65, '#09121e10');
  vignette.addColorStop(1, '#09121eaa');
  c.fillStyle = vignette;
  c.fillRect(hero.x, hero.y, hero.width, hero.height);
  const fade = c.createLinearGradient(0, hero.y, 0, hero.y + hero.height);
  fade.addColorStop(0, '#09121e33');
  fade.addColorStop(0.18, '#09121e00');
  fade.addColorStop(0.7, '#09121e00');
  fade.addColorStop(1, '#09121ee6');
  c.fillStyle = fade;
  c.fillRect(hero.x, hero.y, hero.width, hero.height);
  c.restore();
  c.strokeStyle = accent;
  c.lineWidth = 2;
  c.strokeRect(hero.x, hero.y, hero.width, hero.height);
  c.strokeStyle = secondary + '66';
  c.lineWidth = 1;
  c.strokeRect(hero.x + 7, hero.y + 7, hero.width - 14, hero.height - 14);
  c.textAlign = 'center';
  if (model.artwork.name)
    text(model.artwork.name, w / 2, hero.y + hero.height - 22, 22, '#dfeefa', 830);
  // Style plaque, tags, three stats and two signature DNA scores only.
  text('「' + model.profile.name + '」', w / 2, 984, 41, accent, 916);
  text(model.profile.tags.slice(0, 3).join('  ·  '), w / 2, 1025, 23, '#adc4d7', 900);
  model.stats.forEach((stat, i) => {
    const x = 58 + i * 326;
    panel(x, 1054, 312, 130);
    text(stat.label, x + 156, 1092, 23, '#a5bdd1', 275);
    text(stat.value, x + 156, 1157, 48, '#ffffff', 275);
  });
  c.textAlign = 'left';
  text('PLAY DNA / TOP 2', 78, 1220, 18, accent, 450);
  c.textAlign = 'right';
  text('자체 분석', 1002, 1220, 18, '#90a9c1', 230);
  const scores = topShareScores(model.scores);
  c.textAlign = 'center';
  if (!scores.length) text('분석 표본 부족', w / 2, 1275, 28, '#b8cce2');
  scores.forEach((s, i) => {
    const x = scores.length === 1 ? 304 : 78 + i * 490;
    c.textAlign = 'left';
    text(s.label, x, 1263, 27, '#e0ecf6', 300);
    c.textAlign = 'right';
    text(String(s.value), x + 432, 1263, 35, accent, 110);
    c.fillStyle = '#263b50';
    c.fillRect(x, 1283, 432, 5);
    c.fillStyle = accent;
    c.fillRect(x, 1283, (432 * Math.max(0, Math.min(100, s.value))) / 100, 5);
  });
  c.fillStyle = secondary + '66';
  c.fillRect(78, 1321, 924, 1);
  c.textAlign = 'center';
  // Flavor is the existing short style concept, not the long statistical explanation.
  text(model.art.shortFlavorText, w / 2, 1363, 24, '#bdd0e0', 906);
  text('TFT PROFILE ANALYZER', w / 2, 1432, 24, accent, 900);
  text('tft-profile.pages.dev', w / 2, 1466, 18, '#92abc0', 800);
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
