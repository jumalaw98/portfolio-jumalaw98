import { defineConfig, s } from "velite";

export default defineConfig({
  root: "src/content",
  collections: {
    posts: {
      name: "Post",
      pattern: "blog/**/*.mdx",
      schema: s
        .object({
          title: s.string().min(10).max(70),
          slug: s.slug("posts"),
          date: s.isodate(),
          excerpt: s.string().max(160),
          tags: s.array(s.string()).min(1),
          coverImage: s.image(),
          summary: s
            .object({
              hook: s.string().max(240).optional(),
              body: s.string().optional(),
            })
            .optional(),
          devToId: s.number().optional(),
          published: s.boolean(),
          body: s.mdx(),
          metadata: s.metadata(),
        })
        .transform((data) => {
          // Compute readTimeInMinutes from the MDX body word count
          const wordCount = data.metadata.wordCount;
          const readTimeInMinutes = Math.max(1, Math.round(wordCount / 200));
          return { ...data, readTimeInMinutes };
        }),
    },
  },
});
