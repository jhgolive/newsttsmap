const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

let lastNews = "";

app.use(cors());
app.use(express.static("public"));

async function fetchNews() {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
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

fetchNews();
setInterval(fetchNews, 300000);

app.get("/news", (req, res) => {
  res.json({ news: lastNews });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
