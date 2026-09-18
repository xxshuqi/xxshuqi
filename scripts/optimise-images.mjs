// Regenerates every derived image on the site from its source.
//
// The originals ship thumbnails saved at a very high JPEG quality — 800x1200
// frames weighing 400KB — so the grid pulled ~24MB to show 94 photos that each
// render about 341 CSS px wide. This produces what the grid actually needs:
//
//   thumb-<name>-600.webp   600px wide  — phones and 1x displays
//   thumb-<name>.webp       900px wide  — 2x laptops and wide screens
//   thumb-<name>.jpg        900px wide  — fallback for browsers without WebP
//   lightbox/<name>-1200.avif             — phones and standard displays
//   lightbox/<name>-2000.avif             — retina and large displays
//
// No grid tier above 900. A 5K display would want ~1130px for these slots, but
// that tier would have added ~26MB to the repo permanently to serve very few
// visitors. The lightbox uses its own larger variants instead.
//
// Always regenerates from public/uploads/originals/ rather than from the
// existing thumbnails, so nothing is recompressed twice.
//
// Also rewrites thumbWidth/thumbHeight in photos.json, because those feed the
// <img> width/height attributes that reserve layout space before the image
// loads. Leaving them stale would reserve the wrong box and shift the grid.
//
// The About page portrait had the same problem at a smaller scale: 960x1200 at
// 245KB for something that renders 300 CSS px wide. It is handled at the end.
//
// Run with: npm run optimise:images
// Generate only the lightbox variants with:
//   node scripts/optimise-images.mjs --lightbox-only

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const LIGHTBOX_ONLY = process.argv.includes("--lightbox-only");
const PHOTOS = path.join(ROOT, "public/data/photos.json");
const ORIGINALS = path.join(ROOT, "public/uploads/originals");
const THUMBS = path.join(ROOT, "public/uploads/thumbnails");
const LIGHTBOX = path.join(ROOT, "public/uploads/lightbox");

const WIDTH = 900;
const WIDTH_SMALL = 600;
// The grid renders these about 341 CSS px wide, so even the 600px tier is
// oversampled — quality can sit lower than it could for a full-size view.
const WEBP_QUALITY = 75;
const JPEG_QUALITY = 78;
const LIGHTBOX_WIDTH_SMALL = 1200;
const LIGHTBOX_WIDTH_LARGE = 2000;
const AVIF_QUALITY = 55;

fs.mkdirSync(LIGHTBOX, { recursive: true });

const kb = (n) => `${Math.round(n / 1024)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

const photos = JSON.parse(fs.readFileSync(PHOTOS, "utf8"));

let before = 0;
let after = 0;
let webpTotal = 0;
let webpSmallTotal = 0;
let lightboxSmallTotal = 0;
let lightboxLargeTotal = 0;
let skipped = 0;

for (const photo of photos) {
  const originalName = path.basename(photo.originalUrl);
  const originalPath = path.join(ORIGINALS, originalName);
  if (!fs.existsSync(originalPath)) {
    console.warn(`  skip ${originalName} — original missing`);
    skipped++;
    continue;
  }

  const thumbName = path.basename(photo.thumbUrl);            // thumb-x.jpg
  const base = thumbName.replace(/\.jpe?g$/i, "");            // thumb-x
  const jpegPath = path.join(THUMBS, thumbName);
  const webpPath = path.join(THUMBS, `${base}.webp`);
  const webpSmallPath = path.join(THUMBS, `${base}-${WIDTH_SMALL}.webp`);
  const originalStem = path.parse(originalName).name;
  const lightboxSmallPath = path.join(
    LIGHTBOX,
    `${originalStem}-${LIGHTBOX_WIDTH_SMALL}.avif`
  );
  const lightboxLargePath = path.join(
    LIGHTBOX,
    `${originalStem}-${LIGHTBOX_WIDTH_LARGE}.avif`
  );

  if (fs.existsSync(jpegPath)) before += fs.statSync(jpegPath).size;

  const source = sharp(originalPath).rotate(); // honour EXIF orientation

  // withoutEnlargement: a handful of originals are only ~1600px wide, and
  // upscaling them would add bytes without adding detail.
  const resized = (width) =>
    source.clone().resize({ width, withoutEnlargement: true });

  if (!LIGHTBOX_ONLY) {
    await resized(WIDTH).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpegPath);
    await resized(WIDTH).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
    await resized(WIDTH_SMALL).webp({ quality: WEBP_QUALITY }).toFile(webpSmallPath);
  }
  await resized(LIGHTBOX_WIDTH_SMALL)
    .avif({ quality: AVIF_QUALITY, effort: 4 })
    .toFile(lightboxSmallPath);
  await resized(LIGHTBOX_WIDTH_LARGE)
    .avif({ quality: AVIF_QUALITY, effort: 4 })
    .toFile(lightboxLargePath);

  if (!LIGHTBOX_ONLY) {
    const meta = await sharp(jpegPath).metadata();
    photo.thumbWidth = meta.width;
    photo.thumbHeight = meta.height;
  }

  // Deliberately does NOT touch photo.width / photo.height.
  //
  // Five photos (leo-capri-001, leo-capri-003, random-001, random-002,
  // random-004) are recorded as 2400x1600 landscape while the file carries an
  // EXIF orientation flag that makes it render 1600x2400 portrait. .rotate()
  // above honours that flag, so their thumbnails are portrait and disagree
  // with what photos.json claims.
  //
  // Correcting them is a one-line change — and it reshuffles the entire grid,
  // because the masonry balances columns on height / width from these fields.
  // FRM 001 is one of them, so the very first photo moves. The hand-tuned
  // ATTACH_AFTER and MOBILE_SWAP_PAIRS in PortfolioClient were chosen against
  // the current arrangement, and two of them (003, 084) are these same photos.
  //
  // So the wrong numbers are load-bearing for a curated layout. Left as they
  // are on purpose. If you ever do correct them, expect to re-tune those two
  // lists and to review the whole grid.

  after += fs.statSync(jpegPath).size;
  webpTotal += fs.statSync(webpPath).size;
  webpSmallTotal += fs.statSync(webpSmallPath).size;
  lightboxSmallTotal += fs.statSync(lightboxSmallPath).size;
  lightboxLargeTotal += fs.statSync(lightboxLargePath).size;

  process.stdout.write(".");
}

if (!LIGHTBOX_ONLY) {
  fs.writeFileSync(PHOTOS, `${JSON.stringify(photos, null, 2)}\n`);
}

// ── About page portrait ────────────────────────────────────────────────────
// Renders at 300px on desktop, up to 320px on mobile, so 960px covers a 3x
// phone and 640px covers 2x.
//
// Unlike the grid, there is no separate original for this one — the JPEG is
// both source and output. The buffer is read before anything is written so the
// re-encode works off the file as it was, but running this repeatedly still
// recompresses an already-compressed image. Replace the JPEG with a fresh
// export if it ever needs regenerating from scratch.
const ABOUT_DIR = path.join(ROOT, "public/uploads/about");
const ABOUT_SRC = path.join(ABOUT_DIR, "shuqi-portrait.jpg");

if (!LIGHTBOX_ONLY && fs.existsSync(ABOUT_SRC)) {
  const beforeAbout = fs.statSync(ABOUT_SRC).size;
  const buf = fs.readFileSync(ABOUT_SRC);
  const from = (width) =>
    sharp(buf).rotate().resize({ width, withoutEnlargement: true });

  const webp960 = path.join(ABOUT_DIR, "shuqi-portrait.webp");
  const webp640 = path.join(ABOUT_DIR, "shuqi-portrait-640.webp");

  await from(960).webp({ quality: WEBP_QUALITY }).toFile(webp960);
  await from(640).webp({ quality: WEBP_QUALITY }).toFile(webp640);
  await from(960).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(ABOUT_SRC);

  console.log(
    `about portrait        ${kb(beforeAbout)}  ->  ` +
      `${kb(fs.statSync(webp640).size)} (640 webp) / ` +
      `${kb(fs.statSync(webp960).size)} (960 webp) / ` +
      `${kb(fs.statSync(ABOUT_SRC).size)} (jpeg fallback)`
  );
}

console.log("\n");
console.log(`photos processed      ${photos.length - skipped}`);
console.log(`JPEG fallbacks        ${mb(before)}  ->  ${mb(after)}`);
console.log(`WebP 600 (phones)     ${mb(webpSmallTotal)}`);
console.log(`WebP 900 (desktop)    ${mb(webpTotal)}`);
console.log(`AVIF 1200 (lightbox)  ${mb(lightboxSmallTotal)}`);
console.log(`AVIF 2000 (lightbox)  ${mb(lightboxLargeTotal)}`);
console.log(
  `grid payload          ${mb(before)}  ->  ${mb(webpTotal)}   ` +
    `(-${Math.round(100 - (webpTotal / before) * 100)}%)`
);
if (skipped) console.log(`skipped               ${skipped}`);
