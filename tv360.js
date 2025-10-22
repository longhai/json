import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs/promises";

const SITE = "https://tv360.vn/tv/"; // ⚙️ đổi sang site của bạn
const OUTPUT = "iptv.m3u";

function fixUrl(url, base = SITE) {
  try { return new URL(url, base).href; }
  catch { return url; }
}

(async () => {
  const res = await fetch(SITE, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);

  const channels = [];
  $("a[aria-label]").each((_, el) => {
    const name = $(el).attr("aria-label") || "Unknown";
    const href = fixUrl($(el).attr("href"));
    const logo = $(el).find("img").attr("src");
    const stream = $(el).attr("data-stream") || ""; // có thể thay bằng attr khác
    channels.push({ name, href, logo, stream });
  });

  let m3u = "#EXTM3U\n";
  for (const ch of channels) {
    const url = ch.stream || ch.href;
    if (!url) continue;
    m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="Auto",${ch.name}\n${url}\n`;
  }

  await fs.writeFile(OUTPUT, m3u, "utf8");
  console.log(`✅ Tạo xong ${OUTPUT} với ${channels.length} kênh`);
})();
