// index.js
const express = require('express');
const fetch = require('node-fetch'); // node-fetch v2 사용 권장
const cheerio = require('cheerio');
const { URL } = require('url');

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
  // encode the url so it can be used in path
  return '/proxy/' + encodeURIComponent(fullUrl);
}

app.get('/proxy/:encoded(*)', async (req, res) => {
  const encoded = req.params.encoded;
  const targetUrl = decodeURIComponent(encoded);

  try {
    // 전달 헤더 (간단)
    const headers = {
      'User-Agent': req.get('User-Agent') || 'node-proxy',
      'Accept': req.get('Accept') || '*/*',
      // 필요시 쿠키 등 추가할 수 있음
    };

    const resp = await fetch(targetUrl, { headers, redirect: 'follow' });

    // 헤더 전달 (content-type 등) — 다만 일부 보안 헤더 제거
    const contentType = resp.headers.get('content-type') || '';
    // If HTML, rewrite; else pipe binary
    if (contentType.includes('text/html')) {
      let text = await resp.text();

      // load into cheerio to rewrite links
      const $ = cheerio.load(text, { decodeEntities: false });

      const base = targetUrl;

      // rewrite attributes that point to resources or navigation
      const selAttr = [
        ['a', 'href'],
        ['link', 'href'],
        ['script', 'src'],
        ['img', 'src'],
        ['iframe', 'src'],
        ['form', 'action'],
        ['source', 'src'],
      ];
      selAttr.forEach(([sel, attr]) => {
        $(sel).each((i, el) => {
          const old = $(el).attr(attr);
          if (!old) return;
          const abs = makeAbsolute(old, base);
          // rewrite to proxy path (so browser requests go through our proxy)
          $(el).attr(attr, toProxyPath(abs));
        });
      });

      // remove CSP meta tags that may block scripts or frames
      $('meta[http-equiv="Content-Security-Policy"]').remove();

      // Optionally inject <base href="..."> to help relative URLs (but we rewrite anyway)
      // $('head').prepend(`<base href="${base}">`);

      // Send modified HTML
      res.set('content-type', 'text/html; charset=utf-8');
      // remove security headers from upstream by not forwarding them
      res.removeHeader('x-frame-options');
      res.send($.html());
    } else {
      // binary or other content: stream it directly with same content-type
      res.set('content-type', contentType);
      const buffer = await resp.buffer();
      // copy other relevant headers minimally (length)
      const len = resp.headers.get('content-length');
      if (len) res.set('content-length', len);
      res.send(buffer);
    }
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
});

// Root: 간단한 안내 페이지
app.get('/', (req, res) => {
  res.send(`<h3>Simple Proxy</h3>
  <p>Use /proxy/<encoded url> — encoded url is encodeURIComponent(fullUrl)</p>
  <p>예: /proxy/${encodeURIComponent('https://ainews1.co.kr')}</p>`);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
