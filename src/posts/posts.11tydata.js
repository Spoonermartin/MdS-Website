// Directory data for blog posts.
// A post with `draft: true` in its frontmatter is fully excluded from the live
// site: no page is generated and it won't appear in any listing. It still shows
// in the CMS (/admin) so it can be reviewed and published. Untick "Draft" (or set
// draft: false) and the next build publishes it.

module.exports = {
  layout: "post.njk",
  tags: "posts",
  eleventyComputed: {
    permalink: (data) =>
      data.draft ? false : `/${data.page.fileSlug}/index.html`,
    eleventyExcludeFromCollections: (data) => data.draft === true,
  },
};
