// Automatic sitemap generation.
// Scans the hand-coded root pages and the Eleventy blog source, then writes
// sitemap.xml at the repo root. Runs as part of `npm run build`, so the sitemap
// is always accurate — no manual editing, no stale/redirecting URLs.
//
//   lastmod  : last git commit date for the file (falls back to file mtime, then
//              today). For posts, the later of the git date and the frontmatter
//              `date` is used.
//   excludes : drafts (draft: true) are skipped, matching the live build.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SITE = "https://mdswebsites.co.uk";
const ROOT = path.join(__dirname, "..");

// Root .html pages that should NOT appear in the sitemap (private/utility).
const ROOT_EXCLUDE = new Set(["404.html"]);

function gitDate(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (d) return d;
  } catch (_) {}
  try {
    return fs.statSync(path.join(ROOT, file)).mtime.toISOString().slice(0, 10);
  } catch (_) {}
  return new Date().toISOString().slice(0, 10);
}

function cleanUrl(htmlFile) {
  const base = htmlFile.replace(/\.html$/, "");
  return base === "index" ? `${SITE}/` : `${SITE}/${base}`;
}

function priorityFor(htmlFile) {
  if (htmlFile === "index.html") return ["1.0", "monthly"];
  if (htmlFile.startsWith("project-")) return ["0.7", "yearly"];
  return ["0.8", "monthly"];
}

function frontmatter(md) {
  const txt = fs.readFileSync(md, "utf8");
  if (!txt.startsWith("---")) return {};
  const block = txt.split("---")[1] || "";
  const fm = {};
  block.split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+):\s*(.+?)\s*$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
  return fm;
}

function build() {
  const urls = [];

  // --- Hand-coded root pages (clean URLs) ---
  const rootHtml = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html") && !ROOT_EXCLUDE.has(f))
    .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

  for (const f of rootHtml) {
    const [priority, changefreq] = priorityFor(f);
    urls.push({ loc: cleanUrl(f), lastmod: gitDate(f), priority, changefreq });
  }

  // --- Insights listing ---
  urls.push({
    loc: `${SITE}/insights`,
    lastmod: gitDate("src/index.njk"),
    priority: "0.8",
    changefreq: "weekly",
  });

  // --- Published blog posts (exclude drafts) ---
  const postsDir = path.join(ROOT, "src", "posts");
  const posts = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  for (const f of posts) {
    const full = path.join(postsDir, f);
    const fm = frontmatter(full);
    if (String(fm.draft) === "true") continue;
    const slug = f.replace(/\.md$/, "");
    const rel = path.join("src", "posts", f);
    const gd = gitDate(rel);
    const lastmod = fm.date && fm.date > gd ? fm.date : gd;
    urls.push({
      loc: `${SITE}/insights/${slug}/`,
      lastmod,
      priority: "0.6",
      changefreq: "monthly",
    });
  }

  // --- Emit XML ---
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const u of urls) {
    lines.push(
      "  <url>",
      `    <loc>${u.loc}</loc>`,
      `    <lastmod>${u.lastmod}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority}</priority>`,
      "  </url>"
    );
  }
  lines.push("</urlset>");

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), lines.join("\n") + "\n");
  console.log(`[sitemap] wrote ${urls.length} URLs to sitemap.xml`);
}

build();
