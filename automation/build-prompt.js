// Builds the Claude Blog prompt for the next pending post in topics.json.
// Prints the prompt to stdout, or nothing if the queue is empty.
const fs = require("fs");

const data = JSON.parse(fs.readFileSync("automation/topics.json", "utf8"));
const item = (data.queue || []).find((x) => x.status === "pending");
if (!item) process.exit(0);

const today = new Date().toISOString().slice(0, 10);
const readtimeGuess = Math.max(4, Math.round(item.words / 250)) + " min read";

const prompt = `Use the Claude Blog skill to write ONE blog post for MdS Websites — a founder-led Cambridge digital agency. The author is Martin Spooner, who brings 30 years of real business and management experience to web design. Write from the perspective of someone who has actually run a business, in plain English, British spelling. No fluff, no AI clichés.

POST SPEC (from the MdS content strategy — full strategy in automation/blog-strategy.md):
- Working title: ${item.title}
- Content type / template: ${item.template}
- Pillar: ${item.pillar} (${item.type})
- Primary target keyword (choose ONE primary term and use it consistently): ${item.keyword}
- Target length: ${item.words} words
- Category tag: ${item.tag}

QUALITY REQUIREMENTS (these posts must be optimised for Google AND AI citations):
- Open with a 40–60 word answer-first summary paragraph.
- Phrase 60–70% of H2 headings as questions; each H2 section opens with a 40–60 word answer-first paragraph containing a specific stat or concrete claim.
- Cite a few credible external sources inline (UK Gov, ONS, Google, reputable industry reports).
- Include 3–5 internal links to relevant MdS pages: /insights, /services-web-design, /services-branding, /services-digital-marketing, /portfolio, /contact.
- End with an "## Frequently asked questions" section of at least 5 Q&As.
- Use Martin's voice: "I've seen this go wrong / right" first-hand framing where natural.

SAVE the post as a NEW markdown file at exactly this path: src/posts/${item.slug}.md
Do NOT modify any other file.

The YAML frontmatter MUST be exactly these keys:
  title: (final, compelling headline — you may refine the working title)
  description: (1–2 sentence meta description for Google, includes the keyword)
  lead: (the large intro line shown under the headline)
  tag: "${item.tag}"
  readtime: "${readtimeGuess}"
  date: ${today}
  draft: true
Then the article body in Markdown (## headings, bullet lists, > pull-quotes, and the FAQ section).`;

process.stdout.write(prompt);
