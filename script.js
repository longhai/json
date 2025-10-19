import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const BASE_URL = "https://rromd.com";
const START_URL = `${BASE_URL}/`;

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return new JSDOM(await res.text());
}

(async () => {
  try {
    console.log("🔍 Đang tải danh sách từ:", START_URL);
    const dom = await fetchHTML(START_URL);
    const document = dom.window.document;

    const items = document.querySelectorAll(".videos li");
    const channels = [];

    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const href = a?.getAttribute("href")?.trim();
      if (!href) continue;

      const id = href.match(/(\d+)/)?.[1] || `phim-${i + 1}`;
      const name = title?.textContent.trim() || `Phim ${i + 1}`;
      const imgUrl = img?.getAttribute("data-original") || img?.src || "";

      const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      console.log(`🎬 Đang lấy chi tiết: ${name} (${detailUrl})`);

      let playUrl = null;
      try {
        const detailDom = await fetchHTML(detailUrl);
        const playLink = detailDom.window.document.querySelector(".playbtn");
        if (playLink) {
          const hrefPlay = playLink.getAttribute("href");
          playUrl = hrefPlay.startsWith("http")
            ? hrefPlay
            : `${BASE_URL}${hrefPlay}`;
        }
      } catch (err) {
        console.warn(`⚠️ Không lấy được link play cho ${name}: ${err.message}`);
      }

      channels.push({
        id,
        name,
        description: "",
        label: "Full",
        image: {
          url: imgUrl,
          type: "contain",
          width: 1920,
          height: 1080
        },
        display: "default",
        type: "single",
        enable_detail: true,
        sources: [
          {
            id: `source-${i + 1}`,
            name: "Server 1",
            image: null,
            contents: [
              {
                id: `content-${i + 1}`,
                name: "Full",
                image: null,
                streams: [
                  {
                    id: `${id}-stream`,
                    name: "Full",
                    image: {
                      url: imgUrl,
                      type: "contain",
                      width: 1920,
                      height: 1080
                    },
                    stream_links: [
                      {
                        id: `${id}-s1`,
                        name: "Xem ngay",
                        url: playUrl || detailUrl,
                        type: "hls",
                        default: true,
                        enableP2P: true,
                        subtitles: null,
                        remote_data: null,
                        request_headers: null,
                        comments: null
                      }
                    ]
                  }
                ]
              }
            ],
            remote_data: null
          }
        ]
      });
    }

    const data = {
      id: "phimmoichill",
      name: "Phim Mới Chill",
      description: "Danh sách phim mới cập nhật tự động",
      url: BASE_URL,
      color: "#181818",
      grid_number: 2,
      groups: [
        {
          id: "all",
          name: "Tất cả phim",
          display: "vertical",
          grid_number: 1,
          enable_detail: false,
          channels
        }
      ]
    };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Hoàn tất! Tổng số phim: ${channels.length}`);
    console.log("📁 File lưu tại: json/phim.json");
  } catch (err) {
    console.error("❌ Lỗi tổng:", err);
  }
})();
