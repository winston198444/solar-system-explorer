/**
 * Alternative Node/Express proxy (self-hosted).
 * Serves the built SPA from dist/ and proxies /rest/* with the API key.
 *
 *   npm i express
 *   SOLAR_API_KEY=<key> node proxy/server.js
 *
 * Build the SPA first: npm run build
 */
import express from 'express';

const app = express();
const API = 'https://api.le-systeme-solaire.net';
const KEY = process.env.SOLAR_API_KEY ?? '';

app.use(express.static('dist'));

app.use('/rest', async (req, res) => {
  try {
    const upstream = await fetch(API + req.originalUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${KEY}`,
      },
    });
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(await upstream.text());
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', detail: String(err) });
  }
});

app.get('*', (_req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Solar System Explorer on http://localhost:${port}`);
});
