export const siteConfig = {
  name: "たけしん",
  handle: "@たけしん-118",
  channelUrl: "https://www.youtube.com/@たけしん-118",
  subscribeUrl: "https://www.youtube.com/@たけしん-118?sub_confirmation=1",
  headline: "まだ見たことのない世界へ、\n一緒に冒険しよう！",
  lead:
    "主役MODと補助MODで生まれる、いつもとは少し違うマイクラの世界。小さな目標をひとつずつ追いかけながら、気の向くまま冒険します。",
  about:
    "たけしんです！普段とはちょっと違うMODの世界を、気の向くまま冒険しています。新しい景色や発見を、一緒に楽しんでもらえたらうれしいです！",
  featured: {
    eyebrow: "NEXT ADVENTURE",
    title: "新しいMOD冒険、準備中",
    description:
      "主役になる冒険MODを試しながら、次の世界への入口を準備しています。シリーズが始まったら、ここから最初の一歩へ案内します。",
    imageUrl: "/hero-portal.png",
    playlistUrl: "",
    accent: "#6fe2d4",
  },
} as const;

export type LatestVideo = {
  id: string;
  title: string;
  publishedAt: string;
  publishedLabel?: string;
  thumbnailUrl: string;
  watchUrl: string;
};
