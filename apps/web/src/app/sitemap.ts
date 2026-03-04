import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://evenly.com";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/#features`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/#pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/#faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
