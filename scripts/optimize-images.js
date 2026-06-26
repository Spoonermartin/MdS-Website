// Automatic blog image optimization.
// Runs before the Eleventy build. Scans the CMS media folder (assets/blog) and,
// for any new/changed image, resizes it to a sensible max width and re-compresses
// it IN PLACE (same filename, so no links need changing). A small manifest records
// what's already been optimized so images are never recompressed on later builds.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "assets", "blog");
const MANIFEST = path.join(DIR, ".optimized.json");
const MAX_WIDTH = 1600;       // plenty for full-width blog images (incl. retina)
const JPEG_QUALITY = 80;
const EXTS = new Set([".jpg", ".jpeg", ".png"]);

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function walk(dir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

async function run() {
  if (!fs.existsSync(DIR)) {
    console.log("[img] no assets/blog folder, skipping");
    return;
  }
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")); } catch (_) {}

  const files = walk(DIR).filter((f) => EXTS.has(path.extname(f).toLowerCase()));
  let processed = 0;

  for (const file of files) {
    const rel = path.relative(DIR, file);
    const buf = fs.readFileSync(file);
    const hash = sha(buf);
    if (manifest[rel] === hash) continue; // already optimized, unchanged

    try {
      const ext = path.extname(file).toLowerCase();
      let img = sharp(buf).rotate(); // honour EXIF orientation, then strip metadata
      const meta = await img.metadata();
      if (meta.width && meta.width > MAX_WIDTH) img = img.resize({ width: MAX_WIDTH });
      if (ext === ".png") img = img.png({ compressionLevel: 9, palette: true });
      else img = img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

      const out = await img.toBuffer();
      // only rewrite if we actually saved space
      const finalBuf = out.length < buf.length ? out : buf;
      fs.writeFileSync(file, finalBuf);
      manifest[rel] = sha(finalBuf);
      processed++;
      const saved = ((1 - finalBuf.length / buf.length) * 100).toFixed(0);
      console.log(`[img] ${rel}: ${(buf.length/1024).toFixed(0)}KB -> ${(finalBuf.length/1024).toFixed(0)}KB (-${saved}%)`);
    } catch (e) {
      console.warn(`[img] skipped ${rel}: ${e.message}`);
      manifest[rel] = hash; // don't retry a broken file every build
    }
  }

  // prune manifest entries for images that no longer exist
  const present = new Set(files.map((f) => path.relative(DIR, f)));
  for (const k of Object.keys(manifest)) if (!present.has(k)) delete manifest[k];

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[img] done. ${processed} image(s) optimized, ${files.length} total.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
