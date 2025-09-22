const express = require("express");
const fetch = require("node-fetch"); // v2
const cheerio = require("cheerio");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

// 절대 URL 변환
function makeAbsolute(url, base) {
  try { return new URL(url, base).toString(); }
  catch { return url; }
}

// 프록시 경로 변환
function toProxyPath(fullUrl) {
  return "/proxy/" + encodeURIComponent(fullUrl);
}

// CSS 내부 url(...) 치환
function rewriteCssUrls(cssText, base) {
  return cssText.replace(/url\(([^)]+)\)/g, (match, p1) => {
    let urlStr = p1.trim().replace(/['"]/g, "");
    if (/^data:/.test(urlStr)) return match;
    const abs = makeAbsolute(urlStr, base);
    if (/^https?:\/\//i.test(abs)) return `url(${toProxyPath(abs)})`;
    return match; // http/https 아닌 URL은 그대로
  });
}

// CORS 허용
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// 프록시 처리
app.get("/proxy/:encoded(*)", async (req, res) => {
  const encoded = req.params.encoded;
  const targetUrl = decodeURIComponent(encoded);

  // HTTP/HTTPS 체크
  if (!/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).send("Invalid URL: Only HTTP/HTTPS supported");
  }

  try {
    const headers = {
      "User-Agent": req.get("User-Agent") || "node-proxy",
      Accept: req.get("Accept") || "*/*",
    };

    const resp = await fetch(targetUrl, { headers, redirect: "follow" });
    const contentType = resp.headers.get("content-type") || "";

    // 404 처리
    if (resp.status === 404) {
      if (targetUrl.endsWith(".js")) {
        res.set("content-type", "application/javascript");
        return res.send("// file not found");
      }
      if (targetUrl.endsWith(".css")) {
        res.set("content-type", "text/css");
        return res.send("/* file not found */");
      }
      return res.status(404).send("Not found");
    }

    if (contentType.includes("text/html")) {
      let html = await resp.text();
      const $ = cheerio.load(html, { decodeEntities: false });
      const base = targetUrl;

      // HTML 내 모든 링크, script, img, iframe, form, source 경로 변환
      const selAttr = [
        ["a", "href"], ["link", "href"], ["script", "src"],
        ["img", "src"], ["iframe", "src"], ["form", "action"],
        ["source", "src"],
      ];

      selAttr.forEach(([sel, attr]) => {
        $(sel).each((i, el) => {
          const old = $(el).attr(attr);
          if (!old) return;
          const abs = makeAbsolute(old, base);
          if (/^https?:\/\//i.test(abs)) {
            $(el).attr(attr, toProxyPath(abs));
          }
        });
      });

      // style 태그 CSS 경로 변환
      $("style").each((i, el) => {
        const cssText = $(el).html();
        $(el).html(rewriteCssUrls(cssText, base));
      });

      // CSP 제거
      $("meta[http-equiv='Content-Security-Policy']").remove();

      res.set("content-type", "text/html; charset=utf-8");
      res.send($.html());

    } else if (contentType.includes("text/css")) {
      let cssText = await resp.text();
      cssText = rewriteCssUrls(cssText, targetUrl);
      res.set("content-type", "text/css; charset=utf-8");
      res.send(cssText);

    } else {
      res.set("content-type", contentType);
      const buffer = await resp.buffer();
      res.send(buffer);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

// 메인 페이지 (Firebase 포인터)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/receiver.html");
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
