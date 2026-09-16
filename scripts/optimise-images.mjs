// Regenerates every derived image on the site from its source.
//
// The originals ship thumbnails saved at a very high JPEG quality — 800x1200
// frames weighing 400KB — so the grid pulled ~24MB to show 94 photos that each
// render about 341 CSS px wide. This produces what the grid actually needs:
//
//   thumb-<name>-600.webp   600px wide  — phones and 1x displays
//   thumb-<name>.webp       900px wide  — 2x laptops and wide screens
//   thumb-<name>.jpg        900px wide  — fallback for browsers without WebP
//
// No tier above 900. A 5K display would want ~1130px for these slots, but that
// tier would have added ~26MB to the repo permanently to serve very few
// visitors, and the grid links straight to the full original anyway.
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

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PHOTOS = path.join(ROOT, "public/data/photos.json");
const ORIGINALS = path.join(ROOT, "public/uploads/originals");
const THUMBS = path.join(ROOT, "public/uploads/thumbnails");

const WIDTH = 900;
const WIDTH_SMALL = 600;
// The grid renders these about 341 CSS px wide, so even the 600px tier is
// oversampled — quality can sit lower than it could for a full-size view.
const WEBP_QUALITY = 75;
const JPEG_QUALITY = 78;

const kb = (n) => `${Math.round(n / 1024)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

const photos = JSON.parse(fs.readFileSync(PHOTOS, "utf8"));

let before = 0;
let after = 0;
let webpTotal = 0;
let webpSmallTotal = 0;
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

  if (fs.existsSync(jpegPath)) before += fs.statSync(jpegPath).size;

  const source = sharp(originalPath).rotate(); // honour EXIF orientation

  // withoutEnlargement: a handful of originals are only ~1600px wide, and
  // upscaling them would add bytes without adding detail.
  const resized = (width) =>
    source.clone().resize({ width, withoutEnlargement: true });

  await resized(WIDTH).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpegPath);
  await resized(WIDTH).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
  await resized(WIDTH_SMALL).webp({ quality: WEBP_QUALITY }).toFile(webpSmallPath);

  const meta = await sharp(jpegPath).metadata();
  photo.thumbWidth = meta.width;
  photo.thumbHeight = meta.height;

  after += fs.statSync(jpegPath).size;
  webpTotal += fs.statSync(webpPath).size;
  webpSmallTotal += fs.statSync(webpSmallPath).size;

  process.stdout.write(".");
}

fs.writeFileSync(PHOTOS, `${JSON.stringify(photos, null, 2)}\n`);

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

if (fs.existsSync(ABOUT_SRC)) {
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
console.log(
  `grid payload          ${mb(before)}  ->  ${mb(webpTotal)}   ` +
    `(-${Math.round(100 - (webpTotal / before) * 100)}%)`
);
if (skipped) console.log(`skipped               ${skipped}`);
