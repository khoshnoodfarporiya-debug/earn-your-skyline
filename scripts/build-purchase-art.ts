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
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";

const PURCHASES = join("art-source", "visuals", "purchases");
const CHARACTERS = join("art-source", "visuals", "characters");
/*
 * Career environments — currently the Chef's pack.
 *
 * They sit beside the career covers in `art-source/visuals/careers` because
 * that is what they are: pictures of a career rather than of a purchasable
 * item. Only the `chef-` prefixed masters go through here; the three cover
 * images were converted before this script existed and re-emitting them would
 * rewrite files nothing asked to change.
 */
const CAREER_ART = join("art-source", "visuals");
const OUT_PURCHASES = join("public", "visuals", "purchases");
const OUT_CHARACTERS = join("public", "visuals", "characters");
const OUT_CAREER_ART = join("public", "visuals");
const BRAND_MASTER = join(
  "art-source",
  "branding",
  "lit-window-mark.svg",
);
const OUT_BRAND = join("public", "visuals", "brand");

const GROUPS = [
  "facilities",
  "departments",
  "equipment",
  /* Ambulances. Same treatment as every other wide purchase image — the group
     exists separately so the shot list, the registry and the folder all agree
     on what a vehicle is. */
  "fleet",
  "homes",
  "lifestyle",
  /* Recruitment artwork. Staff are not a purchase catalogue, but they use
     the same card/detail derivatives and live with the other medical assets. */
  "staff",
] as const;

/** The portrait collections, under `art-source/visuals/characters`. */
const CHARACTER_GROUPS = ["cast", "social"] as const;

/** Career-environment collections, under `art-source/visuals`. */
const CAREER_ART_GROUPS = ["careers", "events", "setbacks", "milestones"] as const;

/**
 * Which masters in a group this batch owns.
 *
 * `careers/` holds two different jobs — three career covers that already ship,
 * and the Chef's environment pack — so the batch says which files are its own
 * rather than converting the whole directory and rewriting the covers.
 */
const CAREER_ART_FILES = new Set([
  /* Founder environments. */
  "founder-runway-v1.png",
  "founder-team-v1.png",
  "founder-raising-v1.png",
  /* Politician environments. */
  "politician-polling-v1.png",
  "politician-electorate-v1.png",
  "politician-positions-v1.png",
  "politician-office-v1.png",
  /* Architect environments. */
  "architect-boards-v1.png",
  "architect-offers-v1.png",
  "architect-competitions-v1.png",
  "architect-studio-v1.png",
  /* Engineer environments. */
  "engineer-bench-v1.png",
  "engineer-newbuild-v1.png",
  /* Chef environments. */
  "chef-market-kitchen-v1.png",
  "chef-premises-bistro-v1.png",
  "chef-premises-restaurant-v1.png",
  "chef-premises-flagship-v1.png",
  "chef-premises-destination-v1.png",
  "chef-service-lunch-v1.png",
  "chef-dinner-service-v1.png",
  "chef-service-private-event-v1.png",
  "chef-service-catering-v1.png",
  "chef-service-tasting-v1.png",
  "chef-service-counter-v1.png",
  "chef-larder-fresh-v1.png",
  "chef-larder-expiring-v1.png",
  "chef-supplier-delivery-v1.png",
  "chef-brigade-briefing-v1.png",
  "chef-event-critic-v1.png",
  /* Solicitor environments and work states. */
  "solicitor-borrowed-desk-v1.png",
  "solicitor-chambers-v1.png",
  "solicitor-established-firm-v1.png",
  "solicitor-court-corridor-v1.png",
  "solicitor-client-meeting-v1.png",
  "solicitor-case-files-v1.png",
  "solicitor-case-preparation-v1.png",
  "solicitor-negotiation-v1.png",
  "solicitor-hearing-v1.png",
  "solicitor-legal-team-v1.png",
  "solicitor-regulatory-investigation-v1.png",
  /* Shared state artwork. */
  "event-outbreak-containment-v1.png",
  "setback-collapse-v1.png",
  "setback-suspension-v1.png",
  "setback-insolvency-v1.png",
  "setback-disgrace-v1.png",
  "milestone-debt-free-v1.png",
  "milestone-first-million-v1.png",
  "milestone-international-group-v1.png",
  "milestone-second-site-v1.png",
  "milestone-went-viral-v1.png",
  /*
   * November 2026, from docs/VISUALS.md (generated by an image model).
   * Batch 2: the two career screens that had a banner slot and no image.
   */
  "politician-postbag-v1.png",
  "founder-product-v1.png",
  /* Batch 3: the events of the four newer careers. */
  "event-founder-acquihire-v1.png",
  "event-founder-cloudbill-v1.png",
  "event-founder-enterprise-v1.png",
  "event-founder-bridge-v1.png",
  "event-pol-whip-v1.png",
  "event-pol-crisis-v1.png",
  "event-pol-donor-v1.png",
  "event-pol-defection-v1.png",
  "event-arch-value-v1.png",
  "event-arch-planning-v1.png",
  "event-arch-publication-v1.png",
  "event-arch-spouse-v1.png",
  "event-eng-odd-v1.png",
  "event-eng-cheaper-v1.png",
  "event-eng-standard-v1.png",
  "event-eng-rush-v1.png",
  /* Batch 1: one victory scene per career. Converted now; where they show
     is still an open decision (see docs/WORKING_PLAN.md, section 6). */
  "milestone-victory-chef-v1.png",
  "milestone-victory-solicitor-v1.png",
  "milestone-victory-founder-v1.png",
  "milestone-victory-politician-v1.png",
  "milestone-victory-architect-v1.png",
  "milestone-victory-engineer-v1.png",
]);

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

/** Career-selection covers keep their original width for the large cards. */
const COVER_SIZES = [{ suffix: "", width: 1448, quality: 82 }] as const;

const CAREER_COVER_FILES = new Set([
  "career-architect.png",
  "career-founder.png",
  "career-politician.png",
  "career-engineer.png",
]);

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
      prefix: undefined,
    },
    {
      root: CAREER_ART,
      out: OUT_CAREER_ART,
      groups: CAREER_ART_GROUPS.slice(0, 1),
      sizes: COVER_SIZES,
      files: CAREER_COVER_FILES,
    },
    /*
     * The Chef's environment pack. Same two widths as a purchase — a card at
     * 720 and a banner at 1200 — because it is used the same way: a picture of
     * a thing, in a fixed box, at card or hero scale.
     */
    {
      root: CAREER_ART,
      out: OUT_CAREER_ART,
      groups: CAREER_ART_GROUPS,
      sizes: SIZES,
      files: CAREER_ART_FILES,
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

      const ownedFiles = "files" in batch ? batch.files : undefined;
      const files = readdirSync(dir)
        .filter((f) => f.endsWith(".png"))
        .filter((f) => !ownedFiles || ownedFiles.has(f));
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
            const keyPrefix = batch.root === CHARACTERS ? "characters/" : "";
            sizes[`${keyPrefix}${group}/${stem}`] = {
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
 * THE LIT WINDOW — every icon the game ships, from one SVG master.
 *
 * The mark (Nov 2026, docs/BRAND.md) is a dusk scene: a stepped art-deco tower
 * off-centre against a farther one, with one lit window. It is a square,
 * full-bleed picture, so it is itself the app icon — iOS and Android round the
 * corners, and the window sits well inside the central safe zone a "maskable"
 * Android icon may crop to.
 *
 * Rendered from vector at every size rather than resized from one bitmap, so
 * the 16px favicon is drawn at 16px, not shrunk from 512. The name is never
 * baked into an image: the title screen sets "Earn Your Skyline" in the game's
 * own display face beside the mark.
 *
 * The old raster lockup (`earn-your-skyline-logo-v1.png`) stays in
 * art-source/branding as history and is no longer read.
 */
async function buildBrand() {
  if (!existsSync(BRAND_MASTER)) {
    console.warn("  skip brand — no master at " + BRAND_MASTER);
    return;
  }
  mkdirSync(OUT_BRAND, { recursive: true });
  const svg = readFileSync(BRAND_MASTER);
  /* librsvg renders an SVG at its own size unless told the density, so the
     master (512) is rasterised at the density that lands on each size. */
  const render = (size: number) =>
    sharp(svg, { density: Math.max(72, (72 * size) / 512) }).resize(size, size);
  const rounded = async (size: number) => {
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#fff"/></svg>`,
    );
    return sharp(await render(size).png().toBuffer()).composite([
      { input: mask, blend: "dest-in" },
    ]);
  };

  /* The mark inside the interface, with the icon's own rounded corners. */
  for (const size of [64, 128, 256]) {
    await (await rounded(size))
      .webp({ quality: 90, effort: 6 })
      .toFile(join(OUT_BRAND, `logo-mark-${size}.webp`));
  }

  /* Tab icon, iPhone home-screen icon, and the manifest icons. Square and
     full-bleed: the platforms round them. */
  await render(256).png().toFile(join("app", "icon.png"));
  await render(180).png().toFile(join("app", "apple-icon.png"));
  const OUT_ICONS = join("public", "icons");
  mkdirSync(OUT_ICONS, { recursive: true });
  await render(192).png().toFile(join(OUT_ICONS, "icon-192.png"));
  await render(512).png().toFile(join(OUT_ICONS, "icon-512.png"));
  await render(512).png().toFile(join(OUT_ICONS, "icon-maskable-512.png"));

  /* The link-preview card, 1200x630: the same dusk across the whole card and
     the scene in the middle. The title travels as text in the card's own
     metadata, so none is drawn here. */
  const master = svg.toString("utf8");
  const defs = master.match(/<defs>[\s\S]*<\/defs>/)?.[0] ?? "";
  const scene = master
    .replace(/^[\s\S]*<\/defs>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<rect width="512" height="512"[^>]*\/>/g, "");
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    ${defs}
    <rect width="1200" height="630" fill="url(#sky)"/>
    <rect width="1200" height="630" fill="url(#horizon)"/>
    <g transform="translate(285 0) scale(1.2305)">${scene}</g>
  </svg>`;
  await sharp(Buffer.from(card)).png().toFile(join("app", "opengraph-image.png"));

  console.log(
    "  brand: logo-mark 64/128/256, app/icon, app/apple-icon, icons/, app/opengraph-image",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
