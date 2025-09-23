import express from "express";
import Parser from "rss-parser";

const app = express();
const parser = new Parser();

app.get("/news", async (req, res) => {
  let feed = await parser.parseURL("https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko");
  let titles = feed.items.slice(0, 10).map(i => i.title);
  res.json({ articles: titles });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
