const express = require("express");
const cors = require("cors");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 8080;

let lastNews = "뉴스 로딩 중...";

app.use(cors());

// xml2js parser 준비
const parser = new xml2js.Parser({ explicitArray: false });

async function fetchNews() {
  try {
    // 구글 뉴스 RSS
    const res = await fetch(
      "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
    const xml = await res.text();

    const result = await parser.parseStringPromise(xml);

    // 안전하게 배열 처리
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    lastNews = items.map(i => i.title).join("   |   ");
    console.log(`✅ 뉴스 ${items.length}개 가져옴`);
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
    lastNews = "뉴스 로딩 실패 😢";
  }
}

// 서버 시작 전에 한번 로드
fetchNews();
// 5분마다 갱신
setInterval(fetchNews, 300000);

app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
