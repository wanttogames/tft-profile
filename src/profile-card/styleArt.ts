import type { StyleIllustration } from '../analytics/playStyleIllustration';
export interface ArtPath {
  d: string;
  fill: string;
  stroke?: string;
  opacity: number;
}
/** Original vector scene, shared by SVG UI and PNG export. 600×240 coordinate space. */
export function styleArtPaths(art: StyleIllustration): ArtPath[] {
  const layers: ArtPath[] = [
    { d: 'M0 0H600V240H0Z', fill: art.backdrop, opacity: 1 },
    {
      d: 'M0 205L90 124L150 169L210 88L277 178L359 113L430 169L511 94L600 177V240H0Z',
      fill: art.secondary,
      opacity: 0.12,
    },
    {
      d: 'M0 218L75 185L169 204L251 173L340 196L431 171L525 195L600 178V240H0Z',
      fill: art.color,
      opacity: 0.09,
    },
  ];
  if (art.pattern === 'rays') {
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      layers.push({
        d: `M${300 + Math.cos(angle) * 66} ${106 + Math.sin(angle) * 66}L${300 + Math.cos(angle) * 180} ${106 + Math.sin(angle) * 180}`,
        fill: 'none',
        stroke: art.secondary,
        opacity: 0.32,
      });
    }
  } else if (art.pattern === 'orbits') {
    layers.push({
      d: 'M204 106A96 76 0 1 0 396 106A96 76 0 1 0 204 106 M177 106A123 40 0 1 0 423 106A123 40 0 1 0 177 106',
      fill: 'none',
      stroke: art.secondary,
      opacity: 0.4,
    });
  } else {
    layers.push({
      d: 'M186 175V52H214V32H386V52H414V175 M208 166V60H392V166 M177 183H423 M165 192H435',
      fill: 'none',
      stroke: art.secondary,
      opacity: 0.38,
    });
  }
  // Cloaked silhouette and plinth frame the archetype's symbolic artifact.
  layers.push({
    d: 'M258 211L271 170Q284 151 300 151Q316 151 329 170L342 211L315 203L300 222L285 203Z',
    fill: art.secondary,
    opacity: 0.26,
  });
  layers.push({ d: 'M233 226L251 215H349L367 226Z', fill: art.color, opacity: 0.3 });
  layers.push({ d: art.emblemPath, fill: art.backdrop, stroke: art.color, opacity: 1 });
  for (const [x, y] of [
    [106, 52],
    [159, 98],
    [459, 50],
    [490, 113],
    [220, 21],
    [377, 18],
  ]) {
    layers.push({
      d: `M${x - 3} ${y}H${x + 3}M${x} ${y - 3}V${y + 3}`,
      fill: 'none',
      stroke: art.color,
      opacity: 0.6,
    });
  }
  return layers;
}
