# Overnight blog draft automation

Generates a **draft** blog post every other night using Claude Code + the Claude
Blog skill. Drafts are hidden from the live site until you review and publish
them in `/admin`.

## How it works

1. `topics.json` holds a queue of blog topics.
2. On schedule (Mon/Wed/Fri at 02:00), `generate-draft.sh` runs:
   pulls the latest repo → takes the next `pending` topic → has Claude Blog write
   the post into `src/posts/` with `draft: true` → commits & pushes.
3. The post is **not** built to the live site (draft posts are skipped).
4. In the morning, open `https://mdswebsites.co.uk/admin`, find the post (it has
   **Draft** ticked), review/edit it, untick **Draft**, and Publish.
   That publish triggers the normal build and it goes live.

## Prerequisites (one-time check)

- Claude Code CLI installed and logged in. Test: `claude -p "say hi"` should reply.
- Node.js available (you already have it for the site build).
- Run `which claude` and `which node`. If either isn't in
  `/opt/homebrew/bin`, `/usr/local/bin`, or `~/.claude/local`, add its folder to
  the `PATH=` line near the top of `generate-draft.sh`.

## Step 1 — test it manually first (important)

From the project folder:

```bash
bash automation/generate-draft.sh
```

Watch the output. When it finishes, check that a new `*.md` file appeared in
`src/posts/` with `draft: true`, then look in `/admin` — it should show as a
draft. If that works, schedule it.

## Step 2 — schedule it (macOS launchd)

```bash
# copy the schedule into place
cp "automation/com.mds.blogdraft.plist" ~/Library/LaunchAgents/

# load it
launchctl load ~/Library/LaunchAgents/com.mds.blogdraft.plist
```

To stop it later: `launchctl unload ~/Library/LaunchAgents/com.mds.blogdraft.plist`

### Make it run while the Mac is asleep (optional but recommended)

launchd won't run on a sleeping Mac; by default a missed job runs at next wake.
To actually run at 02:00, schedule a wake a few minutes before:

```bash
sudo pmset repeat wakeorpoweron MWF 01:55:00
```

Keep the Mac plugged in. (Remove later with `sudo pmset repeat cancel`.)

## Managing topics

Edit `topics.json`. Add objects to `queue` with `"status": "pending"`. The job
takes the first pending one each run and marks it `drafted`. To get a batch of
ideas, run Claude Blog's `/blog strategy` or `/blog calendar` and paste the
topics in.

## Logs

Output is written to `automation/logs/` (git-ignored). Check
`launchd.out.log` / `launchd.err.log` if a run didn't produce a draft.

## Notes

- Cadence is a ceiling, not a quota — only publish the good ones. Thin or
  repetitive posts can hurt SEO, so the human review step is the safeguard.
- Each run uses your Claude usage.
- Nothing goes live without you unticking **Draft** in `/admin`.
