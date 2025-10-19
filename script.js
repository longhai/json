import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const BASE_URL = "https://rromd.com";

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  return new JSDOM(await res.text());
}

(async () => {
  try {
    const dom = await fetchHTML(BASE_URL);
    const items = dom.window.document.querySelectorAll(".videos li");
    const channels = [];

    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const href = a?.href?.trim();
      if (!href) continue;

      const id = href.match(/(\d+)/)?.[1] || `phim-${i + 1}`;
      const name = title?.textContent.trim() || `Phim ${i + 1}`;
      const imgUrl = img?.getAttribute("data-original") || img?.src || "";
      const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      let playUrl = detailUrl;
      try {
        const detailDom = await fetchHTML(detailUrl);
        const playLink = detailDom.window.document.querySelector(".playbtn");
        if (playLink) playUrl = playLink.href.startsWith("http") ? playLink.href : `${BASE_URL}${playLink.href}`;
      } catch {}

      channels.push({
        id,
        name,
        image: { url: imgUrl, type: "contain", width: 1920, height: 1080 },
        sources: [{ contents: [{ streams: [{ stream_links: [{ url: playUrl, type: "hls", default: true }] }] }] }]
      });
    }

    const data = { id: "phimmoichill", name: "Phim Mới Chill", groups: [{ id: "all", channels }] };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2));

    console.log(`✅ Hoàn tất! Tổng số phim: ${channels.length}`);
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
