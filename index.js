import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());

app.get("/news", async (req, res) => {
  const query = req.query.query || "삼성";
  const display = req.query.display || 5;

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;

  try {
      const response = await fetch(url, {
          headers: {
              "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
              "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET
          }
      });
  
      if (!response.ok) {
          console.error("네이버 API 오류:", response.status, response.statusText);
          return res.status(502).send("네이버 API 호출 실패");
      }
  
      const data = await response.json();
      res.json(data);
  } catch (err) {
      console.error("fetch 예외:", err);
      res.status(502).send("서버 fetch 실패");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

