/**
 * API Gateway - the only service exposed to the browser.
 *
 * Why plain Express instead of NestJS? This is a thin edge proxy: routing,
 * a JWT check, a rate limit and metrics. Keeping it dependency-light means it
 * starts in ~50 ms and has almost nothing that can break during a deployment.
 */
'use strict';

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const client = require('prom-client');

const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

const UPSTREAM = {
  auth: process.env.AUTH_URL || 'http://localhost:3001',
  emergency: process.env.EMERGENCY_URL || 'http://localhost:3002',
  transport: process.env.TRANSPORT_URL || 'http://localhost:3003',
};

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
client.collectDefaultMetrics({ prefix: 'gateway_' });
const httpDuration = new client.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1, 3],
});

app.use((req, res, next) => {
  if (req.path === '/metrics') return next();
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.baseUrl + (req.route ? req.route.path : req.path),
      status: res.statusCode,
    });
  });
  next();
});

// ---------------------------------------------------------------------------
// Rate limiting: 300 requests / 5 min per IP. Protects every upstream service.
// ---------------------------------------------------------------------------
app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Too many requests, slow down.' },
  }),
);

// ---------------------------------------------------------------------------
// Health + metrics (gateway's own, never proxied)
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'api-gateway', uptime: process.uptime() }),
);

app.get('/ready', async (_req, res) => {
  // The gateway is ready if it can reach at least the auth service.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const r = await fetch(`${UPSTREAM.auth}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error('auth not healthy');
    res.json({ status: 'ready', service: 'api-gateway' });
  } catch {
    res.status(503).json({ status: 'not-ready', service: 'api-gateway' });
  }
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ---------------------------------------------------------------------------
// JWT gate
// ---------------------------------------------------------------------------
const PUBLIC_RULES = [
  { method: 'POST', path: '/api/v1/auth/register' },
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'POST', path: '/api/v1/auth/refresh' },
  { method: 'GET', path: '/api/v1/emergency/notice' },
  { method: 'GET', path: '/api/v1/emergency/providers/nearby' },
  { method: 'GET', path: '/api/v1/transport/universities' },
  { method: 'GET', path: '/api/v1/transport/routes' },
  { method: 'GET', path: '/api/v1/transport/buses' },
  { method: 'GET', path: '/api/v1/transport/live' },
];

// Admin creation routes are NOT in this list, so they stay protected.
const isPublic = (req) =>
  PUBLIC_RULES.some((rule) => rule.method === req.method && req.path === rule.path);

app.use((req, res, next) => {
  // Never trust identity headers coming from the outside.
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];

  if (isPublic(req)) return next();

  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ statusCode: 401, message: 'Missing Bearer token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.user = payload;
    // Downstream services can trust these, because they are set here only.
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    next();
  } catch {
    return res.status(401).json({ statusCode: 401, message: 'Invalid or expired token' });
  }
});

// ---------------------------------------------------------------------------
// Proxies
// ---------------------------------------------------------------------------
const proxy = (target, prefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    onError: (_err, _req, res) => {
      res.status(502).json({ statusCode: 502, message: `Upstream ${prefix} unavailable` });
    },
  });

app.use('/api/v1/auth', proxy(UPSTREAM.auth, 'auth'));
app.use('/api/v1/emergency', proxy(UPSTREAM.emergency, 'emergency'));
app.use('/api/v1/transport', proxy(UPSTREAM.transport, 'transport'));

app.use((_req, res) =>
  res.status(404).json({ statusCode: 404, message: 'Route not found' }),
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`api-gateway listening on :${PORT}`);
  console.log(`  auth      -> ${UPSTREAM.auth}`);
  console.log(`  emergency -> ${UPSTREAM.emergency}`);
  console.log(`  transport -> ${UPSTREAM.transport}`);
});

// Graceful shutdown for Kubernetes.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, closing gateway`);
    process.exit(0);
  });
}
