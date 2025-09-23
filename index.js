const express = require("express");
const fetch = require("node-fetch"); // Node 18 이전 버전은 node-fetch 필요
const app = express();
const PORT = 3000;

let lastNews = "";

app.get("/news", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    const data = await response.json();
    const newsText = data.items.map(i => i.title).join("   |   ");

    if (newsText !== lastNews) {
      lastNews = newsText;
    }

    res.json({ news: lastNews });
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
    res.status(500).json({ error: "뉴스 불러오기 실패" });
  }
});

// 정적 파일 제공
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
