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
    const res = await fetch(
      "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    console.log('Fetch status:', res.status);
    const xml = await res.text();
    const result = await parser.parseStringPromise(xml);
    console.log('Parsed result:', result.rss.channel.item?.length);
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];
    lastNews = items.map(i => i.title).join(" | ");
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

