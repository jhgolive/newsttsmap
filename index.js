const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

let lastNews = "";

app.use(cors());

import Parser from "rss-parser";
const parser = new Parser();

async function fetchNews() {
  try {
    const feed = await parser.parseURL("https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko");
    const newsText = feed.items.map(i => i.title).join("   |   ");
    lastNews = newsText;
  } catch (err) {
    console.error(err);
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

