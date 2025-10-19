import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const BASE_URL = "https://rromd.com"; // Trang gốc KHÔNG có dấu "/" cuối
const START_URL = `${BASE_URL}/`; // Trang danh sách phim

async function fetchHTML(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "vi,en;q=0.9",
      },
      timeout: 20000
    });
    const text = await res.text();
    return new JSDOM(text);
  } catch (err) {
    console.warn(`⚠️ Lỗi tải ${url}: ${err.message}`);
    return null;
  }
}

(async () => {
  try {
    console.log("🔍 Đang tải danh sách từ:", START_URL);
    const dom = await fetchHTML(START_URL);
    if (!dom) throw new Error("Không thể tải trang danh sách!");
    const document = dom.window.document;

    const items = document.querySelectorAll(".videos li");
    const channels = [];

    console.log(`📄 Tìm thấy ${items.length} phim.`);

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

      console.log(`🎬 Đang lấy chi tiết: ${name}`);

      let playUrl = null;
      try {
        const detailDom = await fetchHTML(detailUrl);
        if (detailDom) {
          const doc = detailDom.window.document;

          // Thử tìm link playbtn trước
          const playBtn = doc.querySelector(".btn.playbtn");
          if (playBtn) {
            const hrefPlay = playBtn.getAttribute("href");
            if (hrefPlay) {
              playUrl = hrefPlay.startsWith("http")
                ? hrefPlay
                : `${BASE_URL}${hrefPlay}`;
            }
          }

          // Nếu không có playbtn, thay link ảnh bằng link play
          if (!playUrl) {
            const headA = doc.querySelector(".videos .head a");
            if (headA) {
              const altHref = headA.getAttribute("href");
              if (altHref?.includes("/vodplay/")) {
                playUrl = altHref.startsWith("http")
                  ? altHref
                  : `${BASE_URL}${altHref}`;
              }
            }
          }

          // Dự phòng: nếu vẫn không có, giữ link chi tiết
          if (!playUrl) playUrl = detailUrl;
        }
      } catch (err) {
        console.warn(`⚠️ Không lấy được link play cho ${name}: ${err.message}`);
        playUrl = detailUrl;
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
                        url: playUrl,
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
            ]
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
