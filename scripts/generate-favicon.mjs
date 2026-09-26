/**
 * generate-favicon.mjs — derive the Veldic Wear favicon set from the master logo.
 *
 * The store logo (`public/Logo.webp`) is the tight 1881x279 wordmark crop:
 * a "V"-shaped suit-on-a-hanger mark followed by the "VELDIC WEAR" lettering.
 * A favicon needs the MARK ONLY (no wordmark), so this script:
 *
 *   1. Scans the alpha channel column-by-column and takes the FIRST glyph run.
 *      The mark is the first run and is wider than any single letter, so this
 *      stays correct without hard-coding pixel coordinates.
 *   2. Measures that run's vertical extent, then centres it on a square,
 *      transparent canvas (no stretching — aspect ratio is preserved).
 *   3. Renders the ICO / PNG / Apple touch icon from that single canvas, so
 *      every size is derived from one source of truth.
 *
 * Outputs (Next.js App Router file conventions, auto-injected as <link> tags):
 *   app/favicon.ico     — 16/32/48/256 (browser tabs, Windows shortcuts)
 *   app/icon.png        — 279x279 native (1:1, no upscaling)
 *   app/apple-icon.png  — 180x180, flattened onto white (iOS home screen)
 *
 * Usage:  node scripts/generate-favicon.mjs
 * Requires `sharp` (already present as a Next.js dependency).
 */
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public", "Logo.webp");
const APP_DIR = path.join(ROOT, "app");

/** PNG-compressed ICO entries. 16/32/48 cover tabs + OS chrome; 256 is the
 *  high-res entry Windows/Chrome pick for shortcuts and taskbar pins. */
const ICO_SIZES = [16, 32, 48, 256];
/** Native mark height — rendering 1:1 keeps the hanger hook and lapels crisp. */
const PNG_SIZE = 279;
const APPLE_SIZE = 180;
/** iOS composites transparency unpredictably, so the Apple icon is opaque. */
const APPLE_BACKGROUND = "#FFFFFF";
/** Alpha ≤ this is treated as fully transparent (drops lossy edge haze). */
const ALPHA_FLOOR = 10;
/** Alpha ≥ this is treated as fully opaque (keeps flat fills uniform). */
const ALPHA_CEIL = 250;

/**
 * Locate the mark inside the source artwork.
 * @returns {Promise<{canvas: Buffer, size: number}>} a squared canvas with the
 *   mark centred, plus the canvas edge length.
 */
async function extractMark() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height, channels } = info;
  const alphaAt = (x, y) => data[(y * width + x) * channels + 3];
  const INK = 16; // ignore near-transparent anti-aliasing haze

  // Horizontal glyph runs (the wordmark is a sequence of separate runs).
  const runs = [];
  let open = null;
  for (let x = 0; x < width; x++) {
    let painted = false;
    for (let y = 0; y < height; y++) {
      if (alphaAt(x, y) > INK) {
        painted = true;
        break;
      }
    }
    if (painted && !open) open = { from: x, to: x };
    else if (painted) open.to = x;
    else if (open) {
      runs.push(open);
      open = null;
    }
  }
  if (open) runs.push(open);
  if (!runs.length) throw new Error(`No artwork found in ${SRC}`);

  // First run = the "V" mark; every later run is a single letter of the wordmark.
  const mark = runs[0];
  const markWidth = mark.to - mark.from + 1;

  // Vertical extent of the mark alone.
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = mark.from; x <= mark.to; x++) {
      if (alphaAt(x, y) > INK) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        break;
      }
    }
  }
  const markHeight = bottom - top + 1;

  // Square canvas: side = the taller dimension, so nothing is ever cropped.
  const side = Math.max(markWidth, markHeight);
  const left = Math.round((side - markWidth) / 2);
  const topPad = Math.round((side - markHeight) / 2);

  const cropped = await sharp(SRC)
    .extract({ left: mark.from, top, width: markWidth, height: markHeight })
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Scrub lossy-compression artefacts while placing the mark on the canvas.
  // WebP keeps noisy RGB under fully transparent pixels; those bytes are
  // invisible but defeat PNG filtering (they inflated the 256 px entry from
  // ~20 KB to ~42 KB). Snapping the near-transparent / near-opaque tails also
  // removes the faint halo the lossy encoder leaves along every edge.
  const canvas = Buffer.alloc(side * side * 4); // zeroed == transparent
  for (let y = 0; y < markHeight; y++) {
    for (let x = 0; x < markWidth; x++) {
      const from = (y * markWidth + x) * 4;
      const alpha = cropped[from + 3];
      if (alpha <= ALPHA_FLOOR) continue; // leave the pixel transparent
      const to = ((y + topPad) * side + (x + left)) * 4;
      canvas[to] = cropped[from];
      canvas[to + 1] = cropped[from + 1];
      canvas[to + 2] = cropped[from + 2];
      canvas[to + 3] = alpha >= ALPHA_CEIL ? 255 : alpha;
    }
  }

  console.log(
    `  source   ${info.width}x${info.height} -> mark ${markWidth}x${markHeight} ` +
      `at x ${mark.from}..${mark.to}, y ${top}..${bottom}`
  );
  console.log(`  canvas   ${side}x${side} (mark centred, transparent)`);

  return {
    canvas: await sharp(canvas, {
      raw: { width: side, height: side, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toBuffer(),
    size: side,
  };
}

/**
 * PNG encoder options.
 * Small sizes keep lossless RGBA so anti-aliased edges stay perfectly smooth.
 * Large sizes (>= 128 px) switch to a 256-colour palette: at that scale the
 * quantisation is imperceptible for this two-tone line art (verified by eye at
 * 256 px) and it roughly thirds the byte count — worth it because every icon
 * is fetched separately on a cold cache.
 */
function pngOptions(palette) {
  return palette
    ? { compressionLevel: 9, palette: true, quality: 100, effort: 10 }
    : { compressionLevel: 9 };
}

/**
 * Downscale the squared canvas to one edge length. Small sizes get a light
 * unsharp mask so the thin hanger hook / lapel edges survive at 16-32 px.
 */
async function renderAt(canvas, size, { sharpen, palette } = {}) {
  let pipeline = sharp(canvas).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: "lanczos3",
  });
  if (sharpen) pipeline = pipeline.sharpen({ sigma: 0.6 });
  return pipeline.png(pngOptions(palette)).toBuffer();
}

/**
 * Assemble a multi-size .ico container around PNG payloads.
 * Layout: 6-byte ICONDIR, one 16-byte ICONDIRENTRY per image, then the images.
 */
function buildIco(entries) {
  const dir = Buffer.alloc(6 + 16 * entries.length);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // 1 = icon (2 would be cursor)
  dir.writeUInt16LE(entries.length, 4);

  let offset = dir.length;
  entries.forEach(({ size, data }, i) => {
    const at = 6 + i * 16;
    const dim = size >= 256 ? 0 : size; // 0 encodes 256 in the ICO spec
    dir.writeUInt8(dim, at);
    dir.writeUInt8(dim, at + 1);
    dir.writeUInt8(0, at + 2); // colour count (0 = truecolour)
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([dir, ...entries.map((e) => e.data)]);
}

async function main() {
  await mkdir(APP_DIR, { recursive: true });
  console.log(`Veldic Wear favicon set <- ${path.relative(ROOT, SRC)}`);
  const { canvas, size } = await extractMark();

  // 1. Multi-size .ico — replaces the stock Next.js/Vercel favicon.
  const icoEntries = [];
  for (const s of ICO_SIZES) {
    icoEntries.push({
      size: s,
      data: await renderAt(canvas, s, { sharpen: s <= 48, palette: s >= 128 }),
    });
  }
  const ico = buildIco(icoEntries);
  await writeFile(path.join(APP_DIR, "favicon.ico"), ico);
  console.log(
    `  wrote    app/favicon.ico (${ICO_SIZES.join("/")}) ${ico.length} bytes`
  );

  // 2. PNG icon at native resolution (no upscaling => no softness).
  const png =
    size === PNG_SIZE
      ? // The canvas is already at the target edge length — re-encode only.
        await renderAt(canvas, PNG_SIZE, { palette: true })
      : await renderAt(canvas, PNG_SIZE);
  await writeFile(path.join(APP_DIR, "icon.png"), png);
  console.log(
    `  wrote    app/icon.png (${PNG_SIZE}x${PNG_SIZE}) ${png.length} bytes`
  );

  // 3. Apple touch icon — flattened onto white (iOS masks the corners).
  const apple = await sharp(canvas)
    .resize(APPLE_SIZE, APPLE_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "lanczos3",
    })
    .flatten({ background: APPLE_BACKGROUND })
    .png(pngOptions(true))
    .toBuffer();
  await writeFile(path.join(APP_DIR, "apple-icon.png"), apple);
  console.log(
    `  wrote    app/apple-icon.png (${APPLE_SIZE}x${APPLE_SIZE}, ` +
      `${APPLE_BACKGROUND}) ${apple.length} bytes`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
