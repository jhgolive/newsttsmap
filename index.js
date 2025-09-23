const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 8080;

let lastNews = "";

app.use(cors());

// xml2js parser 준비
const parser = new xml2js.Parser({ explicitArray: false });

async function fetchNews() {
  try {
    const res = await fetch(
      "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    );
    const xml = await res.text();
    const result = await parser.parseStringPromise(xml);
    const items = result.rss.channel.item || [];
    console.log('기사 개수:', items.length);
    const newsText = items.map(i => i.title).join("   |   ");
    lastNews = newsText;
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


