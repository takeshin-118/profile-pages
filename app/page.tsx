import type { Metadata } from "next";
import { TakeshinSite } from "./TakeshinSite";
import type { LatestVideo } from "./site-config";

const feedUrl = "https://www.youtube.com/feeds/videos.xml?playlist_id=UULFf9zK-u1buMY2gB75zcd8Cg";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "たけしん",
  description:
    "Minecraft: Java EditionのMOD環境で、まだ見たことのない世界を冒険するYouTubeチャンネル「たけしん」の公式サイト。おすすめシリーズと最新動画を紹介します。",
};

const fallbackVideos: LatestVideo[] = [
  ["HFw4FMTs4gM", "【解説】初心者でも簡単に勝てる？！ベッドウォーズのやり方解説！！", "2026-05-31T09:00:22+00:00"],
  ["oXvqIoixbQU", "CreateMODpart4", "2026-03-21T09:01:07+00:00"],
  ["AebkTWl96-E", "【マインクラフト】CreateMODシリーズ Part3進捗達成", "2026-03-10T15:00:31+00:00"],
  ["-ubgkpBwG7w", "【CreateMODPart2】砂利で鉄を無限化！！", "2026-02-09T03:00:00+00:00"],
  ["gPE_WvJqlxo", "マインクラフト PVP Lifeboatサーバー", "2026-02-01T15:01:12+00:00"],
  ["BsWBcz2pQ_U", "Create MOD Part1", "2026-01-25T15:00:30+00:00"],
].map(([id, title, publishedAt]) => ({
  id,
  title,
  publishedAt,
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  watchUrl: `https://www.youtube.com/watch?v=${id}`,
}));

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

async function getLatestVideos(): Promise<LatestVideo[]> {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return fallbackVideos;

    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    const videos = entries.slice(0, 6).map((entry) => {
      const id = tag(entry, "yt:videoId");
      return {
        id,
        title: tag(entry, "title"),
        publishedAt: tag(entry, "published"),
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    });

    return videos.length === 6 && videos.every((video) => video.id) ? videos : fallbackVideos;
  } catch {
    return fallbackVideos;
  }
}

export default async function Home() {
  return <TakeshinSite latestVideos={await getLatestVideos()} />;
}

