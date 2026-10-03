/**
 * Cloudflare Worker proxy for the Solar System openData API.
 *
 * Why: the API requires the Authorization key even on CORS
 * preflight (OPTIONS) requests, so browsers can never call it
 * directly. This worker injects the key server-side.
 *
 * Security:
 *   - Only /rest/ paths are proxied (no open proxy).
 *   - GET/HEAD only, plus OPTIONS for CORS preflight.
 *   - Per-IP rate limit (in-memory, per isolate).
 *   - Cache-Control headers reduce API quota usage.
 *
 * Deploy:
 *   wrangler deploy                 # reads wrangler.toml
 *   wrangler secret put SOLAR_API_KEY
 *
 * Or use the Cloudflare dashboard (Workers →
 * solar-system-explorer → Settings → Variables → Secrets).
 */

const API_ORIGIN = 'https://api.le-systeme-solaire.net';

// Per-IP rate limit: at most 90 requests per 10 seconds.
const RATE_LIMIT = 90;
const RATE_WINDOW_MS = 10_000;
const MAX_TRACKED_IPS = 2000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const record = hits.get(ip);
  if (!record || now - record.start > RATE_WINDOW_MS) {
    if (hits.size >= MAX_TRACKED_IPS) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > RATE_LIMIT;
}

function cacheFor(pathname) {
  if (pathname.includes('knowncount')) return 'public, max-age=3600';
  if (pathname.includes('positions')) return 'public, max-age=300';
  return 'public, max-age=86400'; // bodies list & body detail
}

export default {
  async fetch(request, env) {
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

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    // Only expose the API surface — never proxy arbitrary paths.
    if (!url.pathname.startsWith('/rest/')) {
      return new Response('Not found', { status: 404 });
    }

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (rateLimited(ip)) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    const target = new URL(url.pathname + url.search, API_ORIGIN);
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.SOLAR_API_KEY ?? ''}`,
      },
    });

    // Re-wrap the response to add cache headers (upstream
    // headers are immutable once created).
    const headers = Object.fromEntries(upstream.headers.entries());
    headers['Cache-Control'] = cacheFor(url.pathname);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};
