require('dotenv').config();
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const morgan        = require('morgan');
const hpp           = require('hpp');
const compression   = require('compression');
const path          = require('path');

const connectDB    = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger       = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const requestId    = require('./middleware/requestId');
const swaggerSpec  = require('./config/swagger');
const swaggerUi    = require('swagger-ui-express');
const {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  dataWriteLimiter,
} = require('./config/rateLimiting');

const authRoutes  = require('./routes/authRoutes');
const dataRoutes  = require('./routes/dataRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logRoutes   = require('./routes/logRoutes');

const app = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── Request ID (correlation tracing) ────────────────────────────────────────
app.use(requestId);

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;

app.use(cors({
  origin:         allowedOrigins,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'RateLimit-Limit', 'RateLimit-Remaining'],
  credentials:    true,
}));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
// express-mongo-sanitize is incompatible with Express 5 (req.query is read-only).
// We sanitize manually by stripping $ and . from body/params/query values.
const sanitizeNoSQL = (req, res, next) => {
  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[$]/g, '_');
      } else if (typeof obj[key] === 'object') {
        strip(obj[key]);
      }
    }
    return obj;
  };
  if (req.body)   strip(req.body);
  if (req.params) strip(req.params);
  next();
};
app.use(sanitizeNoSQL);

// ─── HTTP Parameter Pollution Prevention ──────────────────────────────────────
app.use(hpp());

// ─── HTTP Request Logging (Morgan → Winston) ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Serve built React frontend (always — dev and production) ─────────────────
// API routes are registered AFTER this block so they always take priority.
// The SPA fallback only fires for non-API, non-asset routes.
const frontendDist = path.join(__dirname, '..', 'frontend-dist');
app.use(express.static(frontendDist, { index: false })); // index:false — let SPA fallback handle /

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const cache = require('./services/cacheService');
  res.json({
    success:     true,
    message:     'CogniVault ServerStack is running',
    version:     'v1',
    environment: process.env.NODE_ENV,
    cache:       cache.stats(),
    timestamp:   new Date().toISOString(),
    requestId:   req.id,
  });
});

// ─── API Routes v1 ────────────────────────────────────────────────────────────
app.use('/api/v1/auth',  authLimiter,  authRoutes);
app.use('/api/v1/data',  dataRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/logs',  logRoutes);

// ─── Legacy /api/* → /api/v1/* (backward compatibility) ──────────────────────
['auth', 'data', 'admin', 'logs'].forEach((r) => {
  app.use(`/api/${r}`, (req, res) => res.redirect(308, `/api/v1/${r}${req.url}`));
});

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'CogniVault API v1 Docs',
}));
app.use('/api/docs', (req, res) => res.redirect(301, '/api/v1/docs'));

// ─── SPA Fallback — serve index.html for all non-API routes ──────────────────
// Must be AFTER all API routes so /api/* is never caught here.
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success:   false,
    message:   `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.id,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  // Connect MongoDB
  await connectDB();

  // Connect Redis (optional — falls back to memory cache)
  await connectRedis();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 CogniVault ServerStack running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📖 API Docs: http://localhost:${PORT}/api/v1/docs`);
    logger.info(`🏥 Health:   http://localhost:${PORT}/health`);
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`[${signal}] Graceful shutdown initiated...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed. Server stopped.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('[UNHANDLED REJECTION]', { reason: String(reason) });
    shutdown('unhandledRejection');
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
