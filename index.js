import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// 프록시 제외할 URL 패턴들
const skipProxy = [
  "about:blank",
  "chrome-extension://",
  "wcs.naver.com",
  "nam.veta.naver.com",
  "google-analytics.com"
];

// 프록시 라우터
app.use("/proxy", (req, res, next) => {
  const targetUrl = req.url.replace(/^\/proxy\//, "");

  try {
    const decodedUrl = decodeURIComponent(targetUrl);

    // 제외 규칙: 프록시를 안 태우고 바로 리다이렉트
    if (skipProxy.some(pattern => decodedUrl.startsWith(pattern))) {
      console.log("프록시 제외:", decodedUrl);
      return res.redirect(decodedUrl);
    }

    // 실제 프록시 처리
    return createProxyMiddleware({
      target: decodedUrl,
      changeOrigin: true,
      selfHandleResponse: false,

      onProxyReq: (proxyReq, req, res) => {
        // 원본 헤더 제거 → CORS 문제 줄이기
        proxyReq.removeHeader("origin");
      },

      onError: (err, req, res) => {
        console.error("프록시 에러:", err.message);

        // 프록시 실패 시 원본으로 fallback
        res.writeHead(302, { Location: decodedUrl });
        res.end();
      }
    })(req, res, next);

  } catch (e) {
    console.error("URL decode 실패:", targetUrl, e.message);
    res.status(400).send("잘못된 요청입니다.");
  }
});

// 기본 라우트
app.get("/", (req, res) => {
  res.send("Proxy Server is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
