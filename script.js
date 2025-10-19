import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// 🔗 Đổi domain ở đây khi cần
const BASE_URL = "https://rromd.com";
const START_URL = `${BASE_URL}/`;

async function fetchHTML(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000
    });
    return new JSDOM(await res.text());
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

    console.log(`📺 Tìm thấy ${items.length} video.`);

    for (let i = 0; i < items.length; i++) {
      const li = items[i];
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const href = a?.getAttribute("href")?.trim();
      if (!href) continue;

      const name = title?.textContent.trim() || `Video ${i + 1}`;
      const imgUrl = img?.getAttribute("data-original") || img?.src || "";
      const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      // 🔹 Lấy link play trực tiếp
      let playUrl = detailUrl;
      try {
        const detailDom = await fetchHTML(detailUrl);
        if (detailDom) {
          const doc = detailDom.window.document;

          // Ưu tiên nút playbtn
          const playBtn = doc.querySelector(".btn.playbtn");
          if (playBtn) {
            const hrefPlay = playBtn.getAttribute("href");
            if (hrefPlay) {
              playUrl = hrefPlay.startsWith("http")
                ? hrefPlay
                : `${BASE_URL}${hrefPlay}`;
            }
          } else {
            // Nếu không có playbtn, tìm thẻ <a> trong .videos .head
            const headA = doc.querySelector(".videos .head a");
            if (headA) {
              const hrefPlay = headA.getAttribute("href");
              if (hrefPlay?.includes("/vodplay/")) {
                playUrl = hrefPlay.startsWith("http")
                  ? hrefPlay
                  : `${BASE_URL}${hrefPlay}`;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ Không lấy được play URL cho ${name}: ${err.message}`);
      }

      channels.push({
        name,
        image: imgUrl,
        url: playUrl
      });
    }

    const data = {
      name: "Phim Mới Chill",
      description: "Danh sách phim cập nhật tự động",
      source: BASE_URL,
      channels
    };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Hoàn tất! Tổng số video: ${channels.length}`);
    console.log("📁 File lưu tại: json/phim.json");
  } catch (err) {
    console.error("❌ Lỗi tổng:", err);
  }
})();
