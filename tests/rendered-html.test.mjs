import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("公式ページを日本語でサーバーレンダリングする", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ja"/i);
  assert.match(html, /<title>たけしん<\/title>/i);
  assert.match(html, /まだ見たことのない世界へ/);
  assert.match(html, /新しいMOD冒険、準備中/);
  assert.match(html, /LATEST VIDEOS/);
  assert.match(html, /NOT AN OFFICIAL MINECRAFT PRODUCT/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("許可されたYouTubeリンクへ同じサイト内の計測経由で移動する", async () => {
  const response = await render(
    "/go/youtube?kind=test&target=https%3A%2F%2Fwww.youtube.com%2F%40test",
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://www.youtube.com/@test");
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
});

test("外部サイトへの不正なリダイレクトを拒否する", async () => {
  const response = await render(
    "/go/youtube?kind=test&target=https%3A%2F%2Fexample.com%2Fphishing",
  );
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://www.youtube.com/@%E3%81%9F%E3%81%91%E3%81%97%E3%82%93-118",
  );
});

