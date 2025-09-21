// index.js
const express = require("express");
const fetch = require("node-fetch"); // v2
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
    } else {
      res.set("content-type", contentType);
      const buffer = await resp.buffer();
      const len = resp.headers.get("content-length");
      if (len) res.set("content-length", len);
      res.send(buffer);
    }
  } catch (err) {
    console.error("proxy error", err);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.send(`<h3>Simple Proxy Running</h3>
  <p>예: <a href="/proxy/${encodeURIComponent(
    "https://ainews1.co.kr"
  )}">/proxy/ainews1.co.kr</a></p>`);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
