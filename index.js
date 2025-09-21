const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

function makeAbsolute(url, base) {
  try {
    return new URL(url, base).toString();
  } catch (e) {
    return url;
  }
}

function toProxyPath(fullUrl) {
  return "/proxy/" + encodeURIComponent(fullUrl);
}

// CORS 허용
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 프록시
app.get("/proxy/:encoded(*)", async (req, res) => {
  const encoded = req.params.encoded;
  const targetUrl = decodeURIComponent(encoded);

  // about:blank 처리
  if (targetUrl === "about:blank") return res.send("");

  try {
    const headers = {
      "User-Agent": req.get("User-Agent") || "node-proxy",
      Accept: req.get("Accept") || "*/*",
    };

    const resp = await fetch(targetUrl, { headers, redirect: "follow" });
    const contentType = resp.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      let text = await resp.text();
      const $ = cheerio.load(text, { decodeEntities: false });
      const base = targetUrl;

      // HTML 내 링크 JS/CSS/Image/iframe/form 경로 수정
      const selAttr = [
        ["a", "href"],
        ["link", "href"],
        ["script", "src"],
        ["img", "src"],
        ["iframe", "src"],
        ["form", "action"],
        ["source", "src"],
      ];

      selAttr.forEach(([sel, attr]) => {
        $(sel).each((i, el) => {
          const old = $(el).attr(attr);
          if (!old) return;
          const abs = makeAbsolute(old, base);
          $(el).attr(attr, toProxyPath(abs));
        });
      });

      $("meta[http-equiv='Content-Security-Policy']").remove();
      res.set("content-type", "text/html; charset=utf-8");
      res.send($.html());
    } else if (contentType.includes("javascript") || targetUrl.endsWith(".js")) {
      res.set("content-type", "application/javascript");
      const buffer = await resp.buffer();
      res.send(buffer);
    } else if (contentType.includes("css") || targetUrl.endsWith(".css")) {
      res.set("content-type", "text/css");
      const buffer = await resp.buffer();
      res.send(buffer);
    } else {
      res.set("content-type", contentType);
      const buffer = await resp.buffer();
      const len = resp.headers.get("content-length");
      if (len) res.set("content-length", len);
      res.send(buffer);
    }
  } catch (err) {
    console.error("proxy error", err);
    // 존재하지 않는 JS/CSS 요청도 무시하고 빈 파일 반환
    if (targetUrl.endsWith(".js")) return res.type("application/javascript").send("");
    if (targetUrl.endsWith(".css")) return res.type("text/css").send("");
    res.status(500).send("Proxy error: " + err.message);
  }
});

// 테스트
app.get("/", (req, res) => {
  res.send(`<h3>Proxy Running</h3>
  <p>예: <a href="/proxy/${encodeURIComponent(
    "https://www.ainews1.co.kr"
  )}">/proxy/ainews1.co.kr</a></p>`);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
