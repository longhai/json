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
        description: "",
        type: "single",
        display: "text-below",
        enable_detail: true,
        remote_data: { url: playUrl },
        image: { url: imgUrl, type: "contain", width: 320, height: 480 },
        org_metadata: {
          title: name,
          description: "",
          image: imgUrl
        },
        share: { url: detailUrl }
      });
    }

    const data = {
      id: "rromd",
      name: "RoRromd",
      color: "#000000",
      description: "RoRromd - Phim mới cập nhật - Xem phim trực tuyến",
      image: { url: "https://rromd.com/favicon.ico", type: "cover", width: 512, height: 512 },
      grid_number: 3,
      url: BASE_URL,
      groups: [
        {
          id: "gr_all",
          display: "slider",
          channels,
          enable_detail: true
        }
      ],
      channels: [],
      search: { url: `${BASE_URL}/search`, search_key: "q", paging: { page_key: "page", size_key: "limit" } },
      org_metadata: { title: "RoRromd - Phim mới cập nhật", description: "Xem phim trực tuyến miễn phí", image: "https://rromd.com/favicon.ico" }
    };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Hoàn tất! Tổng số phim: ${channels.length}`);
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
