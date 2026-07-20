import type { Metadata } from "next";
import { TakeshinSite } from "./TakeshinSite";
import type { LatestVideo } from "./site-config";

const channelUrl = "https://www.youtube.com/@%E3%81%9F%E3%81%91%E3%81%97%E3%82%93-118";
const longFormVideosUrl = `${channelUrl}/videos`;
const shortsVideosUrl = `${channelUrl}/shorts`;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "たけしん",
  description:
    "Minecraft: Java EditionのMOD環境で、まだ見たことのない世界を冒険するYouTubeチャンネル「たけしん」の公式サイト。おすすめシリーズと最新動画を紹介します。",
};

type JsonRecord = Record<string, unknown>;

type VideoWithViews = LatestVideo & {
  views: number;
};

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function textContent(value: unknown): string {
  const record = asRecord(value);
  if (!record) return typeof value === "string" ? value : "";

  if (typeof record.content === "string") return record.content;
  if (typeof record.simpleText === "string") return record.simpleText;

  if (Array.isArray(record.runs)) {
    return record.runs
      .map((run) => asRecord(run)?.text)
      .filter((text): text is string => typeof text === "string")
      .join("");
  }

  return "";
}

function viewCount(value: string): number {
  const number = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number)) return 0;
  if (value.includes("億")) return number * 100_000_000;
  if (value.includes("万")) return number * 10_000;
  if (/\b[KM]\b/i.test(value)) return number * (value.toUpperCase().includes("M") ? 1_000_000 : 1_000);
  return number;
}

function extractInitialData(html: string): unknown {
  const marker = "var ytInitialData =";
  const start = html.indexOf(marker);
  if (start === -1) return undefined;

  const end = html.indexOf(";</script>", start);
  if (end === -1) return undefined;

  return JSON.parse(html.slice(start + marker.length, end).trim());
}

function videoFromLockup(lockup: JsonRecord): VideoWithViews | undefined {
  if (lockup.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO" || typeof lockup.contentId !== "string") return undefined;

  const metadata = asRecord(lockup.metadata);
  const lockupMetadata = asRecord(metadata?.lockupMetadataViewModel);
  const title = textContent(lockupMetadata?.title);
  if (!title) return undefined;

  const rows = asRecord(lockupMetadata?.metadata)?.contentMetadataViewModel;
  const metadataRows = asRecord(rows)?.metadataRows;
  const metadataParts = Array.isArray(metadataRows)
    ? metadataRows.flatMap((row) => {
        const parts = asRecord(row)?.metadataParts;
        return Array.isArray(parts) ? parts : [];
      })
    : [];
  const labels = metadataParts.map(textContent).filter(Boolean);

  return {
    id: lockup.contentId,
    title,
    publishedAt: new Date().toISOString(),
    publishedLabel: labels.at(-1),
    thumbnailUrl: `https://i.ytimg.com/vi/${lockup.contentId}/hqdefault.jpg`,
    watchUrl: `https://www.youtube.com/watch?v=${lockup.contentId}`,
    views: viewCount(labels[0] ?? ""),
  };
}

function videoFromShortsLockup(lockup: JsonRecord): VideoWithViews | undefined {
  const endpoint = asRecord(asRecord(asRecord(lockup.onTap)?.innertubeCommand)?.reelWatchEndpoint);
  const id = endpoint?.videoId;
  const metadata = asRecord(lockup.overlayMetadata);
  const title = textContent(metadata?.primaryText);
  if (typeof id !== "string" || !title) return undefined;

  const viewsLabel = textContent(metadata?.secondaryText);
  return {
    id,
    title,
    publishedAt: new Date().toISOString(),
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    views: viewCount(viewsLabel),
  };
}

function collectVideos(value: unknown, videos: VideoWithViews[], seen: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectVideos(item, videos, seen));
    return;
  }

  const record = asRecord(value);
  if (!record) return;

  const content = asRecord(asRecord(record.richItemRenderer)?.content);
  if (content) {
    const video = videoFromLockup(asRecord(content.lockupViewModel) ?? {})
      ?? videoFromShortsLockup(asRecord(content.shortsLockupViewModel) ?? {});
    if (video && !seen.has(video.id)) {
      seen.add(video.id);
      videos.push(video);
    }
  }

  Object.values(record).forEach((item) => collectVideos(item, videos, seen));
}

async function getLatestVideos(
  videosUrl: string,
  limit: number,
  sortByViews = false,
): Promise<LatestVideo[]> {
  try {
    const response = await fetch(videosUrl, {
      headers: { "Accept-Language": "ja-JP,ja;q=0.9" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error(`YouTube returned ${response.status}`);

    const videos: VideoWithViews[] = [];
    collectVideos(extractInitialData(await response.text()), videos, new Set());
    return (sortByViews ? videos.toSorted((a, b) => b.views - a.views) : videos).slice(0, limit);
  } catch (error) {
    console.error("Failed to load YouTube videos", error);
    return [];
  }
}

export default async function Home() {
  const [latestVideos, latestShorts] = await Promise.all([
    getLatestVideos(longFormVideosUrl, 4),
    getLatestVideos(shortsVideosUrl, 6, true),
  ]);

  return <TakeshinSite latestVideos={latestVideos} latestShorts={latestShorts} />;
}
