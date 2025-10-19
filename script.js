import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const URL = "https://rromd.com/"; // hoặc đổi thành trang của bạn

(async () => {
  try {
    console.log("Đang tải trang:", URL);
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const films = [];

    // ✅ Dò tất cả các phần tử phim trong div.videos
    document.querySelectorAll(".videos li").forEach((li) => {
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const name = title?.textContent.trim() || "";
      const href = a?.href?.trim() || "";
      const poster = img?.getAttribute("data-original") || img?.src || "";

      if (name && href) {
        films.push({
          ten_phim: name,
          lien_ket: href.startsWith("http") ? href : `${URL.replace(/\/$/, "")}${href}`,
          anh: poster,
        });
      }
    });

    console.log(`Đã thu thập ${films.length} phim`);

    // ✅ Đảm bảo có thư mục json
    if (!fs.existsSync("json")) fs.mkdirSync("json");

    // ✅ Ghi kết quả ra file
    fs.writeFileSync("json/phim.json", JSON.stringify(films, null, 2), "utf8");

    console.log("Đã ghi dữ liệu vào json/phim.json");
  } catch (err) {
    console.error("Lỗi:", err);
    process.exit(1);
  }
})();
