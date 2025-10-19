import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// 🔹 Thay link này bằng link web phim thật của bạn
const URL = "https://rromd.com";

(async () => {
  try {
    console.log("Đang tải trang:", URL);
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const films = [];
    // 🔹 Chọn đúng phần .videos > ul > li
    document.querySelectorAll(".videos ul li").forEach((li) => {
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const href = a?.href ? new URL(a.href, URL).href : "";
      const src = img?.getAttribute("data-original") || img?.src || "";
      const name = title?.textContent.trim() || img?.getAttribute("alt") || "";

      if (href && name) {
        films.push({
          ten_phim: name,
          lien_ket: href,
          anh: src,
        });
      }
    });

    console.log(`✅ Tìm thấy ${films.length} phim`);

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(films, null, 2), "utf8");

    console.log("✅ Đã ghi dữ liệu vào json/phim.json");
  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  }
})();
