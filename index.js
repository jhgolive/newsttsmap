import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors"; // cors 패키지 추가

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 모든 도메인 허용
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
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("API 호출 중 오류 발생");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
