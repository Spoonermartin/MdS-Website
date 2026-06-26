#!/usr/bin/env bash
# ===========================================================================
# MdS Websites — overnight blog DRAFT generator
# ---------------------------------------------------------------------------
# Picks the next pending topic from automation/topics.json, uses Claude Code +
# the Claude Blog skill to write ONE post as a DRAFT, then commits & pushes it.
# Drafts are hidden from the live site (draft: true) until you review and
# publish them in /admin.
#
# TEST IT MANUALLY FIRST:   bash automation/generate-draft.sh
# Then schedule it (see automation/README.md).
# ===========================================================================
set -uo pipefail

# launchd runs with a minimal PATH — make node/git/claude findable.
# If `which claude` shows a different folder, add it here.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.npm-global/bin:$HOME/.claude/local:$PATH"

REPO="/Users/martinspooonerm4/Library/CloudStorage/OneDrive-MdSWebsites/01 - Clients/MdS Websites/1 Design/New Website for MdS Websites"
cd "$REPO" || { echo "Repo not found: $REPO"; exit 1; }

mkdir -p automation/logs
STAMP="$(date +%Y-%m-%d_%H%M)"
echo "================ run $STAMP ================"

# 1) Sync with GitHub first (CMS/bot may have changed things)
git pull --no-rebase --no-edit || { echo "git pull failed — aborting"; exit 1; }

# 2) Find the next pending topic
TOPIC="$(node -e '
const fs=require("fs");
const d=JSON.parse(fs.readFileSync("automation/topics.json","utf8"));
const t=(d.queue||[]).find(x=>x.status==="pending");
process.stdout.write(t ? t.topic : "");
')"
if [ -z "$TOPIC" ]; then
  echo "No pending topics in automation/topics.json — nothing to do."
  exit 0
fi
echo "Topic: $TOPIC"

# 3) Generate the draft with Claude Code + the Claude Blog skill
TODAY="$(date +%Y-%m-%d)"
PROMPT="Use the Claude Blog skill to write ONE high-quality, SEO-optimised blog post for MdS Websites — a Cambridge digital growth agency (branding, web design, local SEO, digital marketing). Topic: \"$TOPIC\".

Save it as a NEW markdown file in the src/posts/ folder. Filename: a short kebab-case slug ending in .md. Do NOT modify any other file.

The YAML frontmatter MUST contain exactly these keys:
  title:        (compelling, specific headline)
  description:  (1-2 sentence meta description for Google)
  lead:         (the large intro line shown under the headline)
  tag:          (one category, e.g. Local SEO, Branding, Web Design, Conversion)
  readtime:     (e.g. \"6 min read\")
  date: $TODAY
  draft: true
Then the article body in Markdown: ## headings, bullet lists, and > for pull quotes. British English, 900-1400 words, genuinely useful, no fluff."

claude -p "$PROMPT" --dangerously-skip-permissions 2>&1 | tail -50

# 4) SAFETY NET — force draft:true on the newest post (in case the model omitted it)
node -e '
const fs=require("fs"), path=require("path");
const dir="src/posts";
const files=fs.readdirSync(dir).filter(f=>f.endsWith(".md"));
if(!files.length){console.log("no posts found");process.exit(0);}
const newest=files.map(f=>({f,t:fs.statSync(path.join(dir,f)).mtimeMs})).sort((a,b)=>b.t-a.t)[0].f;
const fp=path.join(dir,newest);
let s=fs.readFileSync(fp,"utf8");
if(/^---/.test(s)){
  if(/\ndraft:\s*false/.test(s)) s=s.replace(/\ndraft:\s*false/,"\ndraft: true");
  else if(!/\ndraft:\s*true/.test(s)) s=s.replace(/\n---/,"\ndraft: true\n---");
  fs.writeFileSync(fp,s);
  console.log("ensured draft:true on", newest);
}
'

# 5) Mark the topic as drafted
node -e '
const fs=require("fs");
const d=JSON.parse(fs.readFileSync("automation/topics.json","utf8"));
const t=(d.queue||[]).find(x=>x.status==="pending");
if(t){ t.status="drafted"; t.draftedOn=new Date().toISOString().slice(0,10); }
fs.writeFileSync("automation/topics.json", JSON.stringify(d,null,2)+"\n");
'

# 6) Commit & push. [skip ci] = no needless site build (draft is hidden anyway).
git add -A
if git diff --staged --quiet; then
  echo "Nothing new to commit."
else
  git commit -m "Auto-draft blog post for review [skip ci]"
  git pull --no-rebase --no-edit
  git push
fi
echo "================ done $STAMP ================"
