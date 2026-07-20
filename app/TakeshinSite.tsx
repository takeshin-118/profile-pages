"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { siteConfig, type LatestVideo } from "./site-config";

type Theme = "day" | "night";

const themeStorageKey = "takeshin-theme-choice";

function automaticTheme(date = new Date()): Theme {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

function nextThemeBoundary(date = new Date()) {
  const boundary = new Date(date);
  const hour = date.getHours();

  if (hour < 6) {
    boundary.setHours(6, 0, 0, 0);
  } else if (hour < 18) {
    boundary.setHours(18, 0, 0, 0);
  } else {
    boundary.setDate(boundary.getDate() + 1);
    boundary.setHours(6, 0, 0, 0);
  }

  return boundary.getTime();
}

function youtubeHref(target: string, kind: string) {
  const params = new URLSearchParams({ target, kind });
  return `/go/youtube?${params.toString()}`;
}

const youtubeLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function ChannelIcon({ small = false }: { small?: boolean }) {
  return (
    <span className={`channel-icon${small ? " channel-icon--small" : ""}`} aria-hidden="true">
      <Image src="/channel-avatar.jpg" alt="" fill sizes={small ? "42px" : "96px"} />
    </span>
  );
}

export function TakeshinSite({
  latestVideos,
  latestShorts,
}: {
  latestVideos: LatestVideo[];
  latestShorts: LatestVideo[];
}) {
  const [theme, setTheme] = useState<Theme>("day");
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const privacyDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("js");

    const readTheme = () => {
      const now = Date.now();
      let selected = automaticTheme();

      try {
        const stored = localStorage.getItem(themeStorageKey);
        if (stored) {
          const choice = JSON.parse(stored) as { theme?: Theme; expiresAt?: number };
          if (
            (choice.theme === "day" || choice.theme === "night") &&
            typeof choice.expiresAt === "number" &&
            choice.expiresAt > now
          ) {
            selected = choice.theme;
          } else {
            localStorage.removeItem(themeStorageKey);
          }
        }
      } catch {
        localStorage.removeItem(themeStorageKey);
      }

      document.documentElement.dataset.theme = selected;
      setTheme(selected);
    };

    readTheme();
    const timeout = window.setTimeout(readTheme, Math.max(1000, nextThemeBoundary() - Date.now() + 250));
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleTheme = () => {
    const selected: Theme = theme === "day" ? "night" : "day";
    const expiresAt = nextThemeBoundary();
    localStorage.setItem(themeStorageKey, JSON.stringify({ theme: selected, expiresAt }));
    document.documentElement.dataset.theme = selected;
    setTheme(selected);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <header className={`site-header${compactHeader ? " site-header--compact" : ""}`}>
        <a className="brand" href="#top" aria-label="たけしん トップへ">
          <ChannelIcon small />
          <span className="brand-name">たけしん</span>
        </a>

        <nav className="desktop-nav" aria-label="メインメニュー">
          <a href="#adventure">おすすめの冒険</a>
          <a href="#latest">最新動画</a>
          <a href="#about">たけしんについて</a>
        </nav>

        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`${theme === "day" ? "夜" : "昼"}のテーマに切り替える`}>
            <span aria-hidden="true">{theme === "day" ? "☀" : "☾"}</span>
            <span className="theme-label">{theme === "day" ? "昼" : "夜"}</span>
          </button>
          <a className="header-youtube" href={youtubeHref(siteConfig.channelUrl, "header-channel")} {...youtubeLinkProps}>YouTube</a>
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuOpen && <button className="menu-backdrop" type="button" aria-label="メニューを閉じる" onClick={closeMenu} />}
      <nav id="mobile-menu" className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-label="スマートフォンメニュー">
        <a href="#adventure" onClick={closeMenu}>おすすめの冒険</a>
        <a href="#latest" onClick={closeMenu}>最新動画</a>
        <a href="#about" onClick={closeMenu}>たけしんについて</a>
        <a href={youtubeHref(siteConfig.channelUrl, "mobile-channel")} onClick={closeMenu} {...youtubeLinkProps}>YouTubeチャンネルを見る</a>
      </nav>

      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-sky-glow" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">MOD WORLD ADVENTURE</p>
          <h1 id="hero-title">
            {siteConfig.headline.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="hero-lead">{siteConfig.lead}</p>
          <div className="hero-buttons">
            <a className="button button--primary" href="#adventure">おすすめの冒険へ</a>
            <a className="button button--glass" href={youtubeHref(siteConfig.channelUrl, "hero-channel")} {...youtubeLinkProps}>チャンネルを見る</a>
          </div>
        </div>
        <a className="scroll-cue" href="#adventure" aria-label="おすすめの冒険へスクロール">
          <span>SCROLL</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <section id="adventure" className="section section--adventure reveal" aria-labelledby="adventure-title">
        <div className="section-heading">
          <p className="eyebrow">FEATURED SERIES</p>
          <h2 id="adventure-title">まずは、この冒険から。</h2>
          <p>たけしんが選ぶ、初めての人にも見てほしいシリーズです。</p>
        </div>

        <article className="featured-card" style={{ "--series-accent": siteConfig.featured.accent } as React.CSSProperties}>
          <div className="featured-image-wrap">
            <Image
              src={siteConfig.featured.imageUrl}
              alt="未知のMOD世界へつながるポータル"
              fill
              sizes="(max-width: 1100px) 100vw, 58vw"
            />
            <span className="featured-badge">{siteConfig.featured.eyebrow}</span>
          </div>
          <div className="featured-copy">
            <h3>{siteConfig.featured.title}</h3>
            <p>{siteConfig.featured.description}</p>
            {siteConfig.featured.playlistUrl ? (
              <a className="button button--primary" href={youtubeHref(siteConfig.featured.playlistUrl, "featured-playlist")} {...youtubeLinkProps}>この冒険を見る</a>
            ) : (
              <a className="button button--secondary" href="#latest">最新動画を見て待つ</a>
            )}
          </div>
        </article>
      </section>

      <section id="latest" className="section section--latest reveal" aria-labelledby="latest-title">
        <div className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">LATEST VIDEOS</p>
            <h2 id="latest-title">最新の冒険動画</h2>
            <p>Shortsを除いた、最新の通常動画を最大4本表示します。1日以内に自動で更新されます。</p>
          </div>
          <a className="text-link" href={youtubeHref(`${siteConfig.channelUrl}/videos`, "latest-all")} {...youtubeLinkProps}>動画をすべて見る <span aria-hidden="true">→</span></a>
        </div>

        <div className="video-grid">
          {latestVideos.map((video, index) => (
            <a
              className="video-card"
              href={youtubeHref(video.watchUrl, `latest-${index + 1}`)}
              key={video.id}
              {...youtubeLinkProps}
            >
              <span className="video-thumbnail">
                <Image
                  src={video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(max-width: 420px) 100vw, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 17vw"
                  unoptimized
                />
                <span className="play-button" aria-hidden="true">▶</span>
              </span>
              <span className="video-copy">
                <strong>{video.title}</strong>
                <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="shorts" className="section section--latest section--shorts reveal" aria-labelledby="shorts-title">
        <div className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">LATEST SHORTS</p>
            <h2 id="shorts-title">最新のショート動画</h2>
            <p>再生回数の多いShortsを最大6本表示します。1日以内に自動で更新されます。</p>
          </div>
          <a className="text-link" href={youtubeHref(`${siteConfig.channelUrl}/shorts`, "shorts-all")} {...youtubeLinkProps}>Shortsをすべて見る <span aria-hidden="true">→</span></a>
        </div>

        <div className="video-grid shorts-grid">
          {latestShorts.map((video, index) => (
            <a
              className="video-card shorts-card"
              href={youtubeHref(video.watchUrl, `shorts-${index + 1}`)}
              key={video.id}
              {...youtubeLinkProps}
            >
              <span className="video-thumbnail shorts-thumbnail">
                <Image
                  src={video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(max-width: 420px) 50vw, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw"
                  unoptimized
                />
                <span className="play-button" aria-hidden="true">▶</span>
              </span>
              <span className="video-copy shorts-copy">
                <strong>{video.title}</strong>
                <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="about" className="section section--about reveal" aria-labelledby="about-title">
        <div className="about-mark">
          <Image
            className="about-character"
            src="/about-adventure.webp"
            alt="Minecraftの世界に立つたけしんのキャラクター"
            width={2048}
            height={1107}
            unoptimized
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">ABOUT TAKESHIN</p>
          <h2 id="about-title">好奇心のまま、次の世界へ。</h2>
          <p>{siteConfig.about}</p>
          <a className="text-link" href={youtubeHref(siteConfig.channelUrl, "about-channel")} {...youtubeLinkProps}>{siteConfig.handle} を見る <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className="join-section reveal" aria-labelledby="join-title">
        <Image
          className="join-character"
          src="/join-character.png"
          alt="Minecraftのたけしんのキャラクター"
          width={700}
          height={388}
          unoptimized
        />
        <div className="join-copy">
          <p className="eyebrow">JOIN THE ADVENTURE</p>
          <h2 id="join-title">チャンネル登録して、<br />次の冒険を見届けよう！</h2>
          <p>新しいMOD世界へのポータルが開いたら、YouTubeでお知らせします。</p>
          <div className="join-actions">
            <a className="button button--youtube" href={youtubeHref(siteConfig.subscribeUrl, "subscribe")} {...youtubeLinkProps}>チャンネル登録</a>
            <a className="text-link text-link--light" href={youtubeHref(siteConfig.channelUrl, "footer-channel")} {...youtubeLinkProps}>チャンネルを見る <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <ChannelIcon small />
          <strong>たけしん</strong>
        </div>
        <div className="footer-links">
          <button type="button" onClick={() => privacyDialog.current?.showModal()}>プライバシー</button>
          <a href={youtubeHref(siteConfig.channelUrl, "footer-link")} {...youtubeLinkProps}>YouTube</a>
        </div>
        <p className="disclaimer">
          たけしん公式サイト<br />
          NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
        </p>
      </footer>

      <dialog className="privacy-dialog" ref={privacyDialog} onClick={(event) => {
        if (event.target === privacyDialog.current) privacyDialog.current?.close();
      }}>
        <form method="dialog">
          <button className="dialog-close" aria-label="閉じる">×</button>
          <p className="eyebrow">PRIVACY</p>
          <h2>プライバシーについて</h2>
          <p>
            このサイトでは、改善のためにページの閲覧とYouTubeリンクのクリックを匿名の件数として記録します。Cookie、広告用識別子、入力フォームは使用しません。
          </p>
          <button className="button button--primary">閉じる</button>
        </form>
      </dialog>
    </main>
  );
}
