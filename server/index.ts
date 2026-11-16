/* Remitra Phase 1 API server (Node, no framework). Run: node server/index.ts (Node 23.6+ strips TS types).
   - GET  /api/health                 -> status
   - GET  /api/foods/search?q=        -> USDA FoodData Central proxy (key stays server-side)
   - GET  /api/products/:barcode      -> Open Food Facts proxy
   - POST /api/fhir/validate          -> structural FHIR bundle checks
   Future: swap these handlers for AWS services (Cognito auth, HealthLake FHIR store, Bedrock) behind the same routes. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { validateBundle } from '../src/services/fhirValidate.ts';

// minimal .env loader (no dependency)
if (existsSync(new URL('../.env', import.meta.url))) {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const PORT = Number(process.env.API_PORT || 8787);
const USDA_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 1000 * 60 * 60 * 12;

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(body));
}
async function readBody(req: IncomingMessage, limit = 5_000_000): Promise<string> {
  let size = 0; const chunks: Buffer[] = [];
  for await (const c of req) { size += (c as Buffer).length; if (size > limit) throw new Error('too large'); chunks.push(c as Buffer); }
  return Buffer.concat(chunks).toString('utf8');
}

interface UsdaFood { fdcId: number; description: string; foodNutrients?: { nutrientId: number; value: number }[] }
const parseUsda = (foods: UsdaFood[]) => foods.map(f => {
  const g = (id: number) => f.foodNutrients?.find(n => n.nutrientId === id)?.value;
  return { fdcId: f.fdcId, description: f.description, per100: { kcal: g(1008) ?? g(2047) ?? g(2048) ?? 0, protein: g(1003) ?? 0, fiber: g(1079) ?? 0, sugar: g(2000) ?? 0 } };
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, usdaKey: USDA_KEY === 'DEMO_KEY' ? 'shared DEMO_KEY' : 'personal key set', time: new Date().toISOString() });

    if (req.method === 'GET' && url.pathname === '/api/foods/search') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
      const pageSize = Math.min(25, Math.max(1, Number(url.searchParams.get('pageSize')) || 10));
      if (!q) return send(res, 400, { error: 'q is required' });
      const key = `usda:${q.toLowerCase()}:${pageSize}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < TTL) return send(res, 200, hit.body);
      const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(USDA_KEY)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy&query=${encodeURIComponent(q)}`);
      if (r.status === 429) return send(res, 429, { error: 'USDA rate limit reached' });
      if (!r.ok) return send(res, 502, { error: `USDA error ${r.status}` });
      const body = { foods: parseUsda(((await r.json()) as { foods?: UsdaFood[] }).foods || []) };
      cache.set(key, { at: Date.now(), body });
      return send(res, 200, body);
    }

    const prod = url.pathname.match(/^\/api\/products\/(\d{8,14})$/);
    if (req.method === 'GET' && prod) {
      const key = `off:${prod[1]}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < TTL) return send(res, 200, hit.body);
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${prod[1]}.json?fields=product_name,brands,nutriments,serving_quantity,nova_group,allergens_tags,quantity`, { headers: { 'user-agent': 'RemitraPrototype/0.1 (demo)' } });
      if (!r.ok && r.status !== 404) return send(res, 502, { error: `Open Food Facts error ${r.status}` });
      const body = await r.json();
      cache.set(key, { at: Date.now(), body });
      return send(res, 200, body);
    }

    if (req.method === 'POST' && url.pathname === '/api/fhir/validate') {
      const issues = validateBundle(JSON.parse(await readBody(req)));
      return send(res, 200, { errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, issues: issues.slice(0, 200) });
    }

    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: e instanceof Error ? e.message : 'server error' });
  }
});

server.listen(PORT, () => console.log(`Remitra API listening on http://localhost:${PORT} (USDA: ${USDA_KEY === 'DEMO_KEY' ? 'shared DEMO_KEY' : 'personal key'})`));
