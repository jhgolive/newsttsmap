// index.js
const express = require("express");
const fetch = require("node-fetch"); // v2
const cheerio = require("cheerio");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

// 절대 URL 변환
function makeAbsolute(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// 프록시 경로 변환
function toProxyPath(fullUrl) {
  return "/proxy/" + encodeURIComponent(fullUrl);
}

// CSS 내부 url(...) 치환
function rewriteCssUrls(cssText, base) {
  return cssText.replace(/url\(([^)]+)\)/g, (match, p1) => {
    let urlStr = p1.trim().replace(/['"]/g, "");
    if (/^data:/.test(urlStr)) return match; // data URI는 그대로
    const abs = makeAbsolute(urlStr, base);
    return `url(${toProxyPath(abs)})`;
  });
}

// CORS 허용
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 프록시 처리
app.get("/proxy/:encoded(*)", async (req, res) => {
  const encoded = req.params.encoded;
  const targetUrl = decodeURIComponent(encoded);

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

      // HTML 내 링크/스크립트/이미지/iframe/form 등 변환
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

      // CSS 내부 url(...) 치환
      $("style").each((i, el) => {
        const cssText = $(el).html();
        $(el).html(rewriteCssUrls(cssText, base));
      });

      $("link[rel='stylesheet']").each((i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const abs = makeAbsolute(href, base);
        $(el).attr("href", toProxyPath(abs));
      });

      // CSP 제거
      $("meta[http-equiv='Content-Security-Policy']").remove();

      res.set("content-type", "text/html; charset=utf-8");
      res.send($.html());
    } else if (contentType.includes("text/css")) {
      // CSS 파일 자체 처리
      let cssText = await resp.text();
      const base = targetUrl;
      cssText = rewriteCssUrls(cssText, base);
      res.set("content-type", "text/css; charset=utf-8");
      res.send(cssText);
    } else {
      // JS, 이미지 등 정적 파일
      res.set("content-type", contentType);
      const buffer = await resp.buffer();
      res.send(buffer);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.send(`<h3>Proxy Running</h3>
  <p>예: <a href="/proxy/${encodeURIComponent("https://ainews1.co.kr")}">/proxy/ainews1.co.kr</a></p>`);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
