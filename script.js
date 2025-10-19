import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const URL = "https://phimmoichill.mx/";

(async () => {
  try {
    console.log("Đang tải trang:", URL);
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Tìm danh sách phim trong khối "Phim Đề Cử"
    const films = [];
    document.querySelectorAll(".block.top-slide li.item").forEach((el) => {
      const name = el.querySelector("a p")?.textContent.trim() || "";
      const href = el.querySelector("a")?.href || "";
      const img = el.querySelector("img")?.src || "";
      const label = el.querySelector(".label")?.textContent.trim() || "";

      if (name && href) {
        films.push({
          ten_phim: name,
          lien_ket: href,
          anh: img,
          thong_tin: label,
        });
      }
    });

    console.log(`Tìm thấy ${films.length} phim`);

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync("json")) fs.mkdirSync("json");

    // Ghi ra file JSON
    fs.writeFileSync("json/phim.json", JSON.stringify(films, null, 2), "utf8");
    console.log("Đã ghi dữ liệu vào json/phim.json");

  } catch (err) {
    console.error("Lỗi:", err);
    process.exit(1);
  }
})();
