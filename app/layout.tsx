import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "たけしん",
    description:
      "Minecraft: Java EditionのMOD環境で、まだ見たことのない世界を冒険するYouTubeチャンネル「たけしん」の公式サイト。",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "たけしん",
      description: "まだ見たことのない世界へ、一緒に冒険しよう！",
      type: "website",
      locale: "ja_JP",
      images: [{ url: socialImage, width: 1732, height: 908, alt: "たけしん — まだ見たことのない世界へ、一緒に冒険しよう！" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "たけしん",
      description: "まだ見たことのない世界へ、一緒に冒険しよう！",
      images: [socialImage],
    },
  };
}

const themeBootScript = `
(() => {
  const now = new Date();
  const automatic = now.getHours() >= 6 && now.getHours() < 18 ? "day" : "night";
  let selected = automatic;
  try {
    const raw = localStorage.getItem("takeshin-theme-choice");
    if (raw) {
      const saved = JSON.parse(raw);
      if ((saved.theme === "day" || saved.theme === "night") && saved.expiresAt > Date.now()) {
        selected = saved.theme;
      } else {
        localStorage.removeItem("takeshin-theme-choice");
      }
    }
  } catch {}
  document.documentElement.dataset.theme = selected;
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-theme="day" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
