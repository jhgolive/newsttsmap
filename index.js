const express = require("express");
const cors = require("cors");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

let lastNews = "뉴스 로딩 중...";

// xml2js parser 준비
const parser = new xml2js.Parser({ explicitArray: false });

// 제외할 카테고리 ID
const EXCLUDE_CATEGORIES = [
  "CAAqJggKIiBDQkFTRWdvSUwyMHZNREZxY0dRU0JTSWlnQVAB", // 스포츠
  "CAAqJggKIiBDQkFTRWdvSUwyMHZNR0pJUW5RU0JTSWlnQVAB"  // IT/과학
];

// 가져올 카테고리 RSS URL (IT/과학, 스포츠 제외)
const CATEGORY_RSS = [
  "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko", // 헤드라인
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxY0dRU0JTSWlnQVAB?hl=ko&gl=KR&ceid=KR:ko", // 정치
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREZxY0dRU0JTSWlnQVAB?hl=ko&gl=KR&ceid=KR:ko", // 경제
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR2xqY0dNU0JTSWlnQVAB?hl=ko&gl=KR&ceid=KR:ko", // 사회
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZ4ZERFU0JTSWlnQVAB?hl=ko&gl=KR&ceid=KR:ko"  // 세계/문화
];

// RSS 하나를 fetch + parse
async function fetchRSS(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
    const xml = await res.text();
    const result = await parser.parseStringPromise(xml);
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];
    return items;
  } catch (err) {
    console.error("RSS fetch/parse 실패:", url, err);
    return [];
  }
}

// 전체 뉴스 가져오기
async function fetchAllNews() {
  try {
    const promises = CATEGORY_RSS.map(url => fetchRSS(url));
    const results = await Promise.all(promises);
    const allItems = results.flat();
    lastNews = allItems.map(i => i.title).join("   |   ");
    console.log(`✅ 총 뉴스 ${allItems.length}개 가져옴`);
  } catch (err) {
    console.error("전체 뉴스 가져오기 실패", err);
    lastNews = "뉴스 로딩 실패 😢";
  }
}

// 초기 로드 + 5분마다 갱신
fetchAllNews();
setInterval(fetchAllNews, 300000);

app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
