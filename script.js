import fs from "fs";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const URL = "https://rromd.com/"; 
(async () => {
  try {
    console.log("Đang tải trang:", URL);
    const res = await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const channels = [];

    document.querySelectorAll(".videos li").forEach((li, i) => {
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      const title = li.querySelector(".title");

      const href = a?.href?.trim() || "";
      const id = href.match(/(\d+)/)?.[1] || `phim-${i + 1}`;
      const name = title?.textContent.trim() || `Phim ${i + 1}`;
      const imgUrl = img?.getAttribute("data-original") || img?.src || "";

      if (!href) return;

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
                        name: "Server 1",
                        url: href.startsWith("http")
                          ? href
                          : `${URL.replace(/\/$/, "")}${href}`,
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
    });

    const data = {
      id: "phimmoichill",
      name: "Phim Moi Chill",
      description: "Danh sách phim mới",
      url: URL,
      color: "#181818",
      grid_number: 2,
      groups: [
        {
          id: "all",
          name: "Tất cả",
          display: "vertical",
          grid_number: 1,
          enable_detail: false,
          channels
        }
      ]
    };

    if (!fs.existsSync("json")) fs.mkdirSync("json");
    fs.writeFileSync("json/phim.json", JSON.stringify(data, null, 2), "utf8");

    console.log("✅ Đã tạo file json/phim.json");
    console.log(`📦 Gồm ${channels.length} phim`);
  } catch (err) {
    console.error("❌ Lỗi:", err);
  }
})();
