require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Static Files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'CogniVault ServerStack is running', timestamp: new Date() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logRoutes);

// ─── Swagger Docs ────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 CogniVault ServerStack running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
