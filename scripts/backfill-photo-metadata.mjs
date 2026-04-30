import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const PHOTOS_PATH = path.join(ROOT, "public/data/photos.json");

const STORY_PATCHES = {
  "copenhagen-003": {
    title: "Copenhagen Harbor",
    location: "Copenhagen, Denmark",
    caption: "Harbor light and a city moving at its own pace.",
    story:
      "A quiet patch of Copenhagen light where the water, buildings, and passing bodies all felt evenly paced. Nothing dramatic happened. That was the reason to keep it.",
  },
  "oslo-045": {
    title: "Oslo Morning",
    location: "Oslo, Norway",
    caption: "Cold air, pale sun, and a street still waking up.",
    story:
      "This frame felt like the first deep breath of the day. The light was soft, the street was nearly still, and the whole scene carried that brief calm before the city properly begins.",
  },
  "tokyo-092": {
    title: "Tokyo at Closing Time",
    location: "Tokyo, Japan",
    caption: "The last stretch of evening before everyone disappears inside.",
    story:
      "Tokyo can feel loud from a distance, but this moment was the opposite. It was the kind of evening where the glow from windows does most of the talking and the street keeps the rest to itself.",
  },
};

function readImageSize(absolutePath) {
  const output = execFileSync(
    "sips",
    ["-g", "pixelWidth", "-g", "pixelHeight", absolutePath],
    { encoding: "utf8" }
  );
  const widthMatch = output.match(/pixelWidth:\s+(\d+)/);
  const heightMatch = output.match(/pixelHeight:\s+(\d+)/);

  if (!widthMatch || !heightMatch) {
    throw new Error(`Unable to read image size for ${absolutePath}`);
  }

  return {
    width: Number(widthMatch[1]),
    height: Number(heightMatch[1]),
  };
}

const photos = JSON.parse(fs.readFileSync(PHOTOS_PATH, "utf8"));

const nextPhotos = photos.map((photo) => {
  const thumbPath = path.join(ROOT, "public", photo.thumbUrl.replace(/^\//, ""));
  const { width, height } = readImageSize(thumbPath);

  const nextPhoto = {
    ...photo,
    thumbWidth: width,
    thumbHeight: height,
  };

  if (photo.id === "random-049" || photo.id === "random-050") {
    nextPhoto.camera = "FUJIFILM X-T30 II";
  }

  if (STORY_PATCHES[photo.id]) {
    Object.assign(nextPhoto, STORY_PATCHES[photo.id]);
  }

  return nextPhoto;
});

fs.writeFileSync(PHOTOS_PATH, `${JSON.stringify(nextPhotos, null, 2)}\n`, "utf8");

console.log(`Updated ${nextPhotos.length} photo records in public/data/photos.json`);
