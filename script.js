import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const urlSource = "https://phimmoichill.mx/";

async function crawlSource() {
  const res = await fetch(urlSource);
  const html = await res.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const movies = [];

  // Ví dụ: tìm các thẻ phim trong trang chính
  document.querySelectorAll(".movie-item a").forEach(elem => {
    const link = elem.href;
    const title = elem.querySelector(".movie-title")?.textContent.trim() || "";
    const poster = elem.querySelector("img")?.src || "";
    movies.push({
      title,
      link,
      poster,
      source: "phimmoichill.mx",
      last_update: new Date().toISOString().split("T")[0]
    });
  });

  return movies;
}

async function main() {
  const data = await crawlSource();
  fs.writeFileSync("phim.json", JSON.stringify(data, null, 2));
  console.log(`Crawl xong, lấy được ${data.length} phim.`);
}

main().catch(e => console.error(e));
