import type { MetadataRoute } from "next";
import { getAllProfileSlugs } from "@/content/profiles";
import { getAllFeatureSlugs } from "@/content/features";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...getAllFeatureSlugs().map((slug) => ({
      url: `${baseUrl}/platform/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getAllProfileSlugs().map((slug) => ({
      url: `${baseUrl}/for/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
