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

      if (!a) continue;

      const id = `phim-${i + 1}`;
      const name = title?.textContent.trim() || `Phim ${i + 1}`;
      const imgUrl = img?.getAttribute("data-original") || img?.src || "";
      const detailUrl = a.href.startsWith("http") ? a.href : `${BASE_URL}${a.href}`;

      // Lấy link play
      let playUrl = detailUrl;
      try {
        const detailDom = await fetchHTML(detailUrl);
        const playBtn = detailDom.window.document.querySelector(".playbtn");
        if (playBtn) playUrl = playBtn.href.startsWith("http") ? playBtn.href : `${BASE_URL}${playBtn.href}`;
      } catch {}

      channels.push({
        id,
        name,
        image: { url: imgUrl, type: "contain", width: 1920, height: 1080 },
        sources: [
          {
            contents: [
              {
                streams: [
                  {
                    stream_links: [
                      { id: `${id}-s1`, url: playUrl, type: "hls", default: true }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
    }

    const data = {
      id: "phimmoichill",
      name: "Phim Mới Chill",
      groups: [
        {
          id: "all",
          name: "Tất cả phim",
          channels
        }
      ]
    };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Hoàn tất! Tổng số phim: ${channels.length}`);
    console.log("📁 File lưu tại: json/phim.json");
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
