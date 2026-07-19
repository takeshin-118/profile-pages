import type { Metadata } from "next";
import { TakeshinSite } from "./TakeshinSite";
import type { LatestVideo } from "./site-config";

const longFormFeedUrl = "https://www.youtube.com/feeds/videos.xml?playlist_id=UULFf9zK-u1buMY2gB75zcd8Cg";
const shortsFeedUrl = "https://www.youtube.com/feeds/videos.xml?playlist_id=UUSHf9zK-u1buMY2gB75zcd8Cg";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "たけしん",
  description:
    "Minecraft: Java EditionのMOD環境で、まだ見たことのない世界を冒険するYouTubeチャンネル「たけしん」の公式サイト。おすすめシリーズと最新動画を紹介します。",
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(entry: string, name: string) {
  return decodeXml(entry.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
}

function attribute(entry: string, tagName: string, attributeName: string) {
  return entry.match(new RegExp(`<${tagName}[^>]*\\s${attributeName}="([^"]*)"`))?.[1] ?? "";
}

async function getLatestVideos(
  feedUrl: string,
  limit: number,
  sortByViews = false,
): Promise<LatestVideo[]> {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    return entries
      .map((entry) => {
        const id = tag(entry, "yt:videoId");
        return {
          id,
          title: tag(entry, "title"),
          publishedAt: tag(entry, "published"),
          thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          watchUrl: `https://www.youtube.com/watch?v=${id}`,
          views: Number(attribute(entry, "media:statistics", "views")) || 0,
        };
      })
      .filter((video) => video.id)
      .sort((a, b) => sortByViews ? b.views - a.views : 0)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export default async function Home() {
  const [latestVideos, latestShorts] = await Promise.all([
    getLatestVideos(longFormFeedUrl, 4),
    getLatestVideos(shortsFeedUrl, 6, true),
  ]);

  return <TakeshinSite latestVideos={latestVideos} latestShorts={latestShorts} />;
}
