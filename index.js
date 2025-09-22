import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 제공 (클라이언트 HTML)
app.use(express.static(path.join(__dirname, 'public')));

// 모든 프록시 요청 처리
app.get('/proxy/*', async (req, res) => {
  try {
    const targetUrl = decodeURIComponent(req.params[0]);

    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('text/html')) {
      let html = await response.text();
      // <base> 삽입 → 상대 경로 문제 해결
      html = `<base href="${targetUrl}">` + html;
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else if (contentType) {
      // JS, CSS, 이미지 등 그대로 전달
      res.set('Content-Type', contentType);
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      // Content-Type 없는 경우
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'application/octet-stream');
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error');
  }
});

// 기본 경로 접속 시 클라이언트 HTML 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
