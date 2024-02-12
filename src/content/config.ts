import { z, defineCollection } from "astro:content";

const version = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    country: z.union([z.string(), z.array(z.string())]),
    seasons: z.array(
      z.object({
        season: z.string(),
        shortSeason: z.string(),
        shortTitle: z.string(),
        year: z.number(),
        unfinished: z.boolean().optional(),
        xOffset: z.number().optional(),
        episodes: z.array(
          z.object({
            title: z.string(),
            date: z.string(),
            // publishDate: z.string().transform((str) => new Date(str)),
            image: z.string().optional(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = {
  version,
};
