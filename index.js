const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");

const app = express();
const PORT = process.env.PORT || 8080;

let lastNews = "";

app.use(cors());

const parser = new Parser();

async function fetchNews() {
  try {
    const feed = await parser.parseURL(
      "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    // 모든 기사 제목 합치기
    const newsText = feed.items.map(item => item.title).join("   |   ");
    lastNews = newsText;
    console.log(`뉴스 업데이트 완료: ${feed.items.length}건`);
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
  }
}

fetchNews();
setInterval(fetchNews, 300000);

app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});
