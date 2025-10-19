import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { URL } from "url";

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

    // Lấy tất cả các item trong videos
    document.querySelectorAll(".videos .item, .videos li.col-xs-6").forEach((el) => {
      const a = el.querySelector("a");
      const img = el.querySelector("img");
      const title = el.querySelector(".title")?.textContent.trim()
                    || el.querySelector("h5")?.textContent.trim()
                    || "";

      if (a && img) {
        const link = new URL(a.getAttribute("href"), SITE).href;
        const image = img.getAttribute("data-original") || img.src;

        // Nếu có các tag liên quan, lưu luôn
        const tags = Array.from(el.querySelectorAll("button a"))
                          .map(btn => ({
                            text: btn.textContent.trim(),
                            link: new URL(btn.getAttribute("href"), SITE).href
                          }));

        films.push({
          name: title,
          url: link,
          img: image,
          tags
        });
      }
    });

    console.log(`Tìm thấy ${films.length} phim`);

    // Lưu dữ liệu vào file JSON
    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(films, null, 2), "utf8");
    console.log("✅ Đã ghi dữ liệu vào json/phim.json");

    // Lấy thông tin chi tiết từ trang phim
    const filmDetails = [];

    for (const film of films) {
      const filmRes = await fetch(film.lien_ket, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });

      const filmHtml = await filmRes.text();
      const filmDom = new JSDOM(filmHtml);
      const filmDocument = filmDom.window.document;

      const rating = filmDocument.querySelector("li:contains('评分：') span")?.textContent.trim();
      const views = filmDocument.querySelector("li:contains('播放量：') span")?.textContent.trim();
      const uploadTime = filmDocument.querySelector("li:contains('上传时间：') span")?.textContent.trim();

      filmDetails.push({
        tieu_de: film.tieu_de,
        lien_ket: film.lien_ket,
        hinh_anh: film.hinh_anh,
        tags: film.tags,
        rating,
        views,
        uploadTime
      });
    }

    // Lưu thông tin chi tiết vào file JSON
    fs.writeFileSync("json/phim_details.json", JSON.stringify(filmDetails, null, 2), "utf8");
    console.log("✅ Đã ghi dữ liệu chi tiết vào json/phim_details.json");

  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  }
})();
