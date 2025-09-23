const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

const categories = {
  headline: "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
  politics: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pIUQ?hl=ko&gl=KR&ceid=KR:ko",
  economy: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pIUQ?hl=ko&gl=KR&ceid=KR:ko",
  society: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pIUQ?hl=ko&gl=KR&ceid=KR:ko",
  it: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pIUQ?hl=ko&gl=KR&ceid=KR:ko",
  world: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pIUQ?hl=ko&gl=KR&ceid=KR:ko"
};

let combinedNews = "";

// RSS2JSON로 카테고리별 10개 뉴스 가져오기
async function fetchCategoryNews(rssUrl) {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.items) {
      return data.items.map(i => i.title);
    }
    return [];
  } catch (err) {
    console.error("뉴스 불러오기 실패", err);
    return [];
  }
}

// 모든 카테고리 뉴스 합치기
async function fetchNews() {
  try {
    const allNews = [];
    for (const cat of Object.keys(categories)) {
      const titles = await fetchCategoryNews(categories[cat]);
      allNews.push(...titles);
    }
    combinedNews = allNews.join("   |   ");
    console.log("뉴스 갱신 완료 ✅");
  } catch (err) {
    console.error(err);
  }
}

// 초기 fetch + 5분마다 갱신
fetchNews();
setInterval(fetchNews, 300000);

// API
app.get("/news", (req, res) => {
  res.json({ news: combinedNews });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
