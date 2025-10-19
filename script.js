import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { URL } from "url"; // 👈 thêm dòng này để tránh lỗi

const SITE = "https://rromd.com/";

(async () => {
  try {
    console.log("Đang tải trang:", SITE);

    const res = await fetch(SITE, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const films = [];

    document.querySelectorAll(".videos li.col-xs-6").forEach((el) => {
      const a = el.querySelector("a");
      const img = el.querySelector("img");
      const title = el.querySelector(".title")?.textContent.trim() || "";

      if (a && img) {
        // sử dụng new URL() hợp lệ
        const link = new URL(a.getAttribute("href"), SITE).href;
        const image = img.getAttribute("data-original") || img.src;

        films.push({
          tieu_de: title,
          lien_ket: link,
          hinh_anh: image,
        });
      }
    });

    console.log(`Tìm thấy ${films.length} phim`);

    if (!fs.existsSync("json")) fs.mkdirSync("json");

    fs.writeFileSync("json/phim.json", JSON.stringify(films, null, 2), "utf8");
    console.log("✅ Đã ghi dữ liệu vào json/phim.json");

  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  }
})();
