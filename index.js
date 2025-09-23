const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 8080;

let lastNews = "";

// CORS 허용
app.use(cors());
app.use(express.static("public"));

// RSS에서 뉴스 가져오기
async function fetchNews() {
  try {
    const feed = await parser.parseURL(
      "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    const items = feed.items.slice(0, 50);
    lastNews = items.map(i => i.title).join("   |   ");
    console.log(`✅ 뉴스 갱신 완료 (${items.length}개)`);
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
    lastNews = "뉴스를 불러올 수 없습니다.";
  }
}


// 초기 뉴스 가져오기 + 5분마다 갱신
fetchNews();
setInterval(fetchNews, 300000);

// API 엔드포인트
app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

// 기본 루트
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

