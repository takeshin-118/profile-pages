const channelUrl = "https://www.youtube.com/@たけしん-118";
const allowedHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const targetValue = requestUrl.searchParams.get("target") ?? channelUrl;
  const kind = (requestUrl.searchParams.get("kind") ?? "unknown").slice(0, 48);

  let target = new URL(channelUrl);
  try {
    const candidate = new URL(targetValue);
    if (candidate.protocol === "https:" && allowedHosts.has(candidate.hostname)) {
      target = candidate;
    }
  } catch {
    target = new URL(channelUrl);
  }

  console.log(JSON.stringify({ event: "youtube_outbound", kind }));

  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

