// Round 2: silhouettes against a dusk sky, bigger windows, towers that fill the icon.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_SVG = process.argv[2];
const OUT_SHEET = process.argv[3];
mkdirSync(OUT_SVG, { recursive: true });

const LAMP = "#F4B860";
const LAMP_HOT = "#FFE2B0";
const INK = "#050A13"; // the silhouette
const INK_FAR = "#111C30"; // towers further away, a step lighter

/* The sky: deep navy at the top warming to a muted dusk at the horizon —
   the same hour the game's art is set in. */
const SKY = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0A1426"/>
  <stop offset="0.62" stop-color="#1C2B4A"/>
  <stop offset="1" stop-color="#4A3A52"/>
</linearGradient>`;
const GLOW = `<radialGradient id="g">
  <stop offset="0" stop-color="${LAMP_HOT}" stop-opacity="0.75"/>
  <stop offset="0.45" stop-color="${LAMP}" stop-opacity="0.28"/>
  <stop offset="1" stop-color="${LAMP}" stop-opacity="0"/>
</radialGradient>`;

const win = (x, y, w, h, glow) =>
  `${glow ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w * 2.2}" ry="${h * 1.9}" fill="url(#g)"/>` : ""}
   <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${LAMP}"/>`;

const concepts = {
  // A2 — one tall tower, full height, a big window high up.
  a2: ({ ink, glow }) => `
    <rect x="176" y="56" width="160" height="456" fill="${ink}"/>
    ${win(226, 140, 60, 76, glow)}`,

  // B2 — the setback skyscraper with a mast; the window in the top tier.
  b2: ({ ink, glow }) => `
    <rect x="248" y="22" width="16" height="70" fill="${ink}"/>
    <rect x="206" y="84" width="100" height="120" fill="${ink}"/>
    <rect x="176" y="196" width="160" height="110" fill="${ink}"/>
    <rect x="140" y="298" width="232" height="214" fill="${ink}"/>
    ${win(230, 112, 52, 64, glow)}`,

  // C2 — a skyline: two far towers and the tall near one, only its window lit.
  c2: ({ ink, far, glow }) => `
    <rect x="40" y="250" width="120" height="262" fill="${far}"/>
    <rect x="352" y="210" width="120" height="302" fill="${far}"/>
    <rect x="176" y="78" width="160" height="434" fill="${ink}"/>
    ${win(226, 150, 60, 76, glow)}`,

  // E — B2's setback tower but offset left, so the window sits on the
  // icon's optical centre and the mast leans the eye upward. Asymmetric.
  e: ({ ink, far, glow }) => `
    <rect x="330" y="232" width="132" height="280" fill="${far}"/>
    <rect x="214" y="30" width="14" height="66" fill="${ink}"/>
    <rect x="172" y="88" width="98" height="122" fill="${ink}"/>
    <rect x="144" y="202" width="154" height="110" fill="${ink}"/>
    <rect x="108" y="304" width="226" height="208" fill="${ink}"/>
    ${win(196, 118, 50, 62, glow)}`,
};

const svg = (inner, dark) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${SKY}${GLOW}</defs>
  <rect width="512" height="512" fill="${dark ? "url(#sky)" : "#F4F1EA"}"/>
  ${inner}
</svg>`;

const DARK = { ink: INK, far: INK_FAR, glow: true };
const LIGHT = { ink: "#08111F", far: "#5B6A82", glow: false };

const tiles = [];
for (const [name, draw] of Object.entries(concepts)) {
  const dark = svg(draw(DARK), true);
  const light = svg(draw(LIGHT), false);
  writeFileSync(join(OUT_SVG, `lit-window-${name}-dark.svg`), dark);
  writeFileSync(join(OUT_SVG, `lit-window-${name}-light.svg`), light);
  tiles.push({ name, dark, light });
}

const ROW_H = 300, W = 1040;
const COL = [20, 300, 510, 600, 660, 720, 820, 900, 960];
const comps = [];
const label = (text) => Buffer.from(`<svg width="600" height="24"><text x="0" y="16" font-family="Arial" font-size="15" fill="#ccd">${text}</text></svg>`);
for (let r = 0; r < tiles.length; r++) {
  const y0 = r * ROW_H + 30;
  const t = tiles[r];
  const at = async (src, size, x, round) => {
    let img = sharp(Buffer.from(src)).resize(size, size);
    if (round) {
      const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#fff"/></svg>`);
      img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: "dest-in" }]);
    }
    comps.push({ input: await img.png().toBuffer(), left: x, top: y0 + Math.round((256 - size) / 2) });
  };
  await at(t.dark, 256, COL[0], false);
  await at(t.dark, 180, COL[1], true);
  await at(t.dark, 64, COL[2], true);
  await at(t.dark, 32, COL[3], false);
  await at(t.dark, 16, COL[4], false);
  await at(t.light, 64, COL[6], false);
  await at(t.light, 32, COL[7], false);
  await at(t.light, 16, COL[8], false);
  comps.push({ input: label(t.name), left: 20, top: y0 - 26 });
}
comps.push({ input: label("256 · iPhone icon 180 · 64 · 32 · 16   |   light: 64 · 32 · 16"), left: 300, top: 2 });
await sharp({ create: { width: W, height: tiles.length * ROW_H + 30, channels: 3, background: "#0b0f17" } })
  .composite(comps).png().toFile(join(OUT_SHEET, "logo-sheet-2.png"));
console.log("ok");
