const express = require("express");
const cors = require("cors");

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
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`;
  const res = await fetch(apiUrl); // 내장 fetch 사용 가능
  const data = await res.json();
  return data.items ? data.items.map(i => i.title) : [];
}

async function fetchAllCategories() {
  const allNews = [];
  for (const url of Object.values(categories)) {
    const titles = await fetchCategoryNews(url); // 카테고리별 10개
    allNews.push(...titles);
  }
  return allNews;
}


// 초기 fetch + 5분마다 갱신
fetchNews();
setInterval(fetchNews, 300000);

// API
app.get("/news", (req, res) => {
  res.json({ news: combinedNews });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


