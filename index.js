const express = require("express");
const fetch = require("node-fetch"); // Node 18 이상이면 fetch 생략 가능
const app = express();
// public 폴더 안 파일을 정적 파일로 제공
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

let lastNews = "";

// 뉴스 가져오기
async function fetchNews() {
  try {
    const res = await fetch(
      "https://news-production-b9d6.up.railway.app"
    );
    const data = await res.json();
    const newsText = data.items.map(i => i.title).join("   |   ");
    if (newsText !== lastNews) {
      lastNews = newsText;
    }
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
  }
}

// 초기 뉴스 가져오기
fetchNews();
// 5분마다 갱신
setInterval(fetchNews, 300000);

// 정적 파일 제공
app.use(express.static("public"));

// API 엔드포인트
app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


