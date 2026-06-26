// Eleventy config — builds ONLY the blog.
// Input:  src/        (markdown posts + templates)
// Output: blog/       (generated HTML, committed to the repo so Hostinger serves it)
// Existing hand-coded pages at the repo root are NOT touched.

module.exports = function (eleventyConfig) {
  // Human-friendly date, e.g. "26 June 2026"
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  // Short date for the byline, e.g. "June 2026"
  eleventyConfig.addFilter("monthYear", (value) => {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  });

  // Initials for the author avatar
  eleventyConfig.addFilter("initials", (name) =>
    (name || "MS")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );

  return {
    dir: {
      input: "src",
      output: "insights",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
};
