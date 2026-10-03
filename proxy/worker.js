/**
 * Cloudflare Worker proxy for the Solar System openData API.
 *
 * Why: the API requires an Authorization header, which triggers a CORS
 * preflight from browsers, and the key must not ship to the client.
 *
 * Deploy:
 *   npm i -g wrangler
 *   wrangler deploy proxy/worker.js --name solar-api-proxy
 *   wrangler secret put SOLAR_API_KEY
 *
 * Then set VITE_API_BASE_URL=https://<your-worker>.workers.workers.dev
 */
export default {
  async fetch(request: Request, env: { SOLAR_API_KEY?: string }) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }
    const url = new URL(request.url);
    const target = new URL(
      url.pathname + url.search,
      'https://api.le-systeme-solaire.net',
    );
    return fetch(target.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.SOLAR_API_KEY ?? ''}`,
      },
    });
  },
};
