import exifr from "exifr";

export interface ExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  filmSim?: string;
}

export async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const exif = await exifr.parse(buffer, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FilmMode",
        "Saturation",
      ],
    });

    if (!exif) return {};

    const camera = exif.Make && exif.Model
      ? `${exif.Make} ${exif.Model}`.replace(/\s+/g, " ").trim()
      : exif.Model;

    const aperture = exif.FNumber ? `ƒ/${exif.FNumber}` : undefined;

    let shutter: string | undefined;
    if (exif.ExposureTime) {
      if (exif.ExposureTime < 1) {
        shutter = `1/${Math.round(1 / exif.ExposureTime)}s`;
      } else {
        shutter = `${exif.ExposureTime}s`;
      }
    }

    const iso = exif.ISO ? `ISO ${exif.ISO}` : undefined;
    const filmSim = exif.FilmMode ?? undefined;

    return {
      camera,
      lens: exif.LensModel,
      aperture,
      shutter,
      iso,
      filmSim,
    };
  } catch {
    return {};
  }
}
