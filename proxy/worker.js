/**
 * Cloudflare Worker proxy for the Solar System openData API.
 *
 * Why: the API requires the Authorization key even on CORS
 * preflight (OPTIONS) requests, so browsers can never call it
 * directly. This worker injects the key server-side.
 *
 * Deploy:
 *   wrangler deploy                 # reads wrangler.toml
 *   wrangler secret put SOLAR_API_KEY
 *
 * Or use the Cloudflare dashboard (Workers → solar-api-proxy
 * → Settings → Variables → Secrets → add SOLAR_API_KEY).
 */
export default {
  async fetch(request: Request, env: { SOLAR_API_KEY?: string }) {
    // CORS preflight (our app only makes simple GET requests,
    // but answer OPTIONS defensively).
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

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
