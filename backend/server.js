const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const http       = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

const authRoutes         = require('./routes/authRoutes');
const studentRoutes      = require('./routes/studentRoutes');
const facultyRoutes      = require('./routes/facultyRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const courseRoutes       = require('./routes/courseRoutes');
const enrollmentRoutes   = require('./routes/enrollmentRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const gradeRoutes        = require('./routes/gradeRoutes');
const feeRoutes          = require('./routes/feeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes       = require('./routes/reportRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

// ── Env check ─────────────────────────────────────────
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingVars     = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Missing env vars: ${missingVars.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SmartUni Server Starting
  ENV  : ${process.env.NODE_ENV}
  PORT : ${process.env.PORT || 5001}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[WS] Connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`[WS] ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${socket.id}`);
  });
});

// ── CORS ──────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Manual NoSQL sanitizer ────────────────────────────
const sanitizeNoSQL = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeNoSQL(obj[key]);
    }
  }
};
app.use((req, res, next) => {
  if (req.body)   sanitizeNoSQL(req.body);
  if (req.params) sanitizeNoSQL(req.params);
  next();
});

// ── Manual XSS sanitizer ─────────────────────────────
const sanitizeXSS = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const cleaned = {};
    for (const key of Object.keys(value)) cleaned[key] = sanitizeXSS(value[key]);
    return cleaned;
  }
  return value;
};
app.use((req, res, next) => {
  if (req.body) req.body = sanitizeXSS(req.body);
  next();
});

// ── Rate limits ───────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, try again in 15 minutes' },
}));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/faculty',       facultyRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/enrollments',   enrollmentRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/grades',        gradeRoutes);
app.use('/api/fees',          feeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);

// ── Health check ──────────────────────────────────────
app.get('/', (req, res) => res.json({
  message: 'SmartUni API is running',
  version: '1.0.0',
  status:  'healthy',
  env:      process.env.NODE_ENV,
}));

// ── Error handlers ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} with WebSocket support`)
);