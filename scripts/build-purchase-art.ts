/**
 * Purchase artwork: PNG masters in, WebP runtime files out.
 *
 * Run: npm run build:art
 *
 * ------------------------------------------------------------- why a script
 *
 * Thirty-three items, 75MB of PNG. Converting by hand guarantees that the day
 * someone adds a fourteenth lifestyle item the sizes drift, so the conversion
 * is a build step with the rules written down rather than a thing that happened
 * once.
 *
 * `sharp` is already in the tree as a Next.js dependency — the same library the
 * framework uses for its own image optimisation — so nothing is installed for
 * this.
 *
 * -------------------------------------------------------------- two sizes
 *
 * A card renders the image at roughly 320–420px wide and a detail drawer at up
 * to ~600px, so:
 *
 *   card    720px wide — 2× a 360px card, which covers every breakpoint
 *   detail  1200px wide — 2× the widest drawer
 *
 * Both keep the master's aspect ratio rather than cropping to a fixed 16:9.
 * The two source batches are 16:10 and 3:2; forcing either into 16:9 slices
 * the top off a building or the roof off a car, and the brief is explicit that
 * artwork must not be cropped unpredictably. The card component letterboxes
 * with `object-cover` inside a fixed-ratio box instead, where the crop is a
 * layout decision that can be tuned per item.
 *
 * Quality 76 was chosen by measuring: at 720px the difference between 76 and 90
 * is invisible on these subjects and roughly triples the file.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";

const PURCHASES = join("art-source", "visuals", "purchases");
const CHARACTERS = join("art-source", "visuals", "characters");
const OUT_PURCHASES = join("public", "visuals", "purchases");
const OUT_CHARACTERS = join("public", "visuals", "characters");
const BRAND_MASTER = join(
  "art-source",
  "branding",
  "earn-your-skyline-logo-v1.png",
);
const OUT_BRAND = join("public", "visuals", "brand");

const GROUPS = [
  "facilities",
  "departments",
  "equipment",
  "homes",
  "lifestyle",
] as const;

/** The portrait collections, under `art-source/visuals/characters`. */
const CHARACTER_GROUPS = ["cast", "social"] as const;

/** Card width, detail width. Height follows the master's aspect ratio. */
const SIZES = [
  { suffix: "", width: 720, quality: 76 },
  { suffix: "@2x", width: 1200, quality: 78 },
] as const;

/**
 * Portraits are a different job.
 *
 * They are square, they are rendered inside a circle at 36–64px and inside a
 * rounded frame at up to ~160px, and the same file cannot serve both without
 * shipping a 720px file for a 36px hole. So two derivatives:
 *
 *   avatar   160px — 2.5× a 64px circle, which covers every compact use
 *   profile  512px — the expanded People card and the messages header
 *
 * Quality is a touch higher than the purchase artwork: a face at 160px shows
 * compression on skin where a building at 720px does not.
 */
const PORTRAIT_SIZES = [
  { suffix: "", width: 160, quality: 82 },
  { suffix: "@profile", width: 512, quality: 80 },
] as const;

/**
 * Three cars were re-drawn because the first pass produced recognisable
 * badging. Only the v2 files ship; the v1 masters stay in `art-source` as
 * history rather than being deleted.
 */
const SUPERSEDED = new Set([
  "lifestyle-reliable-saloon-v1.png",
  "lifestyle-luxury-saloon-v1.png",
  "lifestyle-sports-car-v1.png",
]);

/** `facility-community-clinic-v2.png` becomes `facility-community-clinic`. */
const stableName = (file: string) =>
  basename(file, ".png").replace(/-v\d+$/, "");

async function main() {
  let written = 0;
  let bytesIn = 0;
  let bytesOut = 0;
  /*
   * Real emitted dimensions, per runtime file.
   *
   * The masters arrive at nine different aspect ratios, so a registry that
   * hardcodes "720×450" is wrong for most of them — and a wrong intrinsic size
   * is exactly the layout shift a reserved box is supposed to prevent.
   * Measuring here means the registry cannot disagree with the bytes.
   */
  const sizes: Record<string, { width: number; height: number }> = {};

  /*
   * Two collections, one loop.
   *
   * Purchases are wide artwork at two widths; portraits are square faces at
   * two much smaller ones. Everything else — version-wins, stable naming,
   * measuring the output — is identical, so the difference is a pair of
   * constants rather than a second script to keep in step.
   */
  const BATCHES = [
    { root: PURCHASES, out: OUT_PURCHASES, groups: GROUPS, sizes: SIZES },
    {
      root: CHARACTERS,
      out: OUT_CHARACTERS,
      groups: CHARACTER_GROUPS,
      sizes: PORTRAIT_SIZES,
    },
  ] as const;

  for (const batch of BATCHES)
    for (const group of batch.groups) {
      const dir = join(batch.root, group);
      if (!existsSync(dir)) {
        console.warn(`  skip ${group} — no such directory`);
        continue;
      }
      const outDir = join(batch.out, group);
      mkdirSync(outDir, { recursive: true });

      const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
      /* Highest version wins, so a -v2 supersedes its -v1 without the list above
       needing an entry for every future revision. SUPERSEDED is belt and
       braces for the three the brief names explicitly. */
      const best = new Map<string, string>();
      for (const f of files) {
        if (SUPERSEDED.has(f)) continue;
        const stem = stableName(f);
        const version = Number(/-v(\d+)\.png$/.exec(f)?.[1] ?? 0);
        const prev = best.get(stem);
        const prevVersion = prev
          ? Number(/-v(\d+)\.png$/.exec(prev)?.[1] ?? 0)
          : -1;
        if (version > prevVersion) best.set(stem, f);
      }

      for (const [stem, file] of [...best].sort()) {
        const src = join(dir, file);
        bytesIn += statSync(src).size;
        for (const { suffix, width, quality } of batch.sizes) {
          const dest = join(outDir, `${stem}${suffix}.webp`);
          const info = await sharp(src)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality, effort: 6 })
            .toFile(dest);
          if (suffix === "") {
            const prefix = batch.root === CHARACTERS ? "characters/" : "";
            sizes[`${prefix}${group}/${stem}`] = {
              width: info.width,
              height: info.height,
            };
          }
          bytesOut += statSync(dest).size;
          written++;
        }
        console.log(`  ${group}/${stem}  ←  ${file}`);
      }
    }

  /*
   * Generated, never hand-edited. `purchaseArt.ts` reads it so every entry
   * declares the size the browser will actually receive.
   */
  const lines = Object.entries(sizes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  "${k}": { width: ${v.width}, height: ${v.height} },`);
  writeFileSync(
    join("lib", "ui", "purchaseArt.generated.ts"),
    [
      "/**",
      " * GENERATED by `npm run build:art` — do not edit.",
      " *",
      " * The intrinsic size of each 720px-wide runtime file, measured as it was",
      " * written. `purchaseArt.ts` reads this so a card reserves the right box",
      " * before the image arrives.",
      " */",
      "export const ART_SIZES: Record<string, { width: number; height: number }> = {",
      ...lines,
      "};",
      "",
    ].join("\n"),
    "utf8",
  );

  await buildBrand();

  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)}MB`;
  console.log(
    `\n${written} files written · ${mb(bytesIn)} of masters → ${mb(bytesOut)} shipped`,
  );
  console.log("  sizes written to lib/ui/purchaseArt.generated.ts\n");
}

/**
 * The logo, cut into the two shapes the interface actually needs.
 *
 * The master is one wide lockup — emblem on the left, wordmark on the right —
 * and neither half works everywhere. The title screen wants the whole thing;
 * a favicon and a tab icon want the emblem alone, square, or the wordmark
 * shrinks to an illegible smear beside a 16px circle.
 *
 * Both are cut from measured bounding boxes rather than guessed percentages:
 * the emblem occupies x 86–624 of 1774, and hardcoding "the left third" would
 * clip the arrow the moment the logo is revised.
 */
async function buildBrand() {
  if (!existsSync(BRAND_MASTER)) {
    console.warn("  skip brand — no master at " + BRAND_MASTER);
    return;
  }
  mkdirSync(OUT_BRAND, { recursive: true });

  /* Measured from the alpha channel of the v1 master. */
  const LOCKUP = { left: 86, top: 87, width: 1607, height: 656 };
  const MARK = { left: 86, top: 87, width: 539, height: 656 };

  /* The lockup, at the two widths the title screen uses. */
  for (const [suffix, width] of [
    ["", 640],
    ["@2x", 1280],
  ] as const) {
    await sharp(BRAND_MASTER)
      .extract(LOCKUP)
      .resize({ width })
      .webp({ quality: 88, effort: 6 })
      .toFile(join(OUT_BRAND, `logo-lockup${suffix}.webp`));
  }

  /*
   * The emblem, padded to a square rather than cropped to one.
   *
   * The arrow breaks the circle top and bottom, so a square crop centred on
   * the ring would slice it. `fit: contain` on a transparent ground keeps the
   * whole mark and centres it, which is what a favicon needs anyway.
   */
  for (const size of [64, 128, 256]) {
    await sharp(BRAND_MASTER)
      .extract(MARK)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90, effort: 6 })
      .toFile(join(OUT_BRAND, `logo-mark-${size}.webp`));
  }

  /*
   * The tab icon, as PNG in `app/`.
   *
   * Next's file convention — it is picked up automatically and never goes
   * through `public/`, so the "no PNG in the bundle" rule is untouched. On the
   * game's own navy, because a browser tab strip is usually light and a
   * transparent navy mark on white loses its darkest strokes.
   */
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 8, g: 17, b: 31, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(BRAND_MASTER)
          .extract(MARK)
          .resize(216, 216, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(join("app", "icon.png"));

  /* And the card a shared link unfurls into: 1200×630, lockup on the void. */
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 8, g: 17, b: 31, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(BRAND_MASTER)
          .extract(LOCKUP)
          .resize({ width: 860 })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(join("app", "opengraph-image.png"));

  console.log("  brand/logo-lockup, logo-mark, app/icon, app/opengraph-image");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
