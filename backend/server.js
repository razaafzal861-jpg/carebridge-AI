/**
 * CareBridge (MediKiosk) — AI OPD Assistant Backend
 * --------------------------------------------------
 * Main Express Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const sessionRoutes = require('./routes/session');
const triageRoutes = require('./routes/triage');
const documentRoutes = require('./routes/documents');
const summaryRoutes = require('./routes/summary');
const doctorRoutes = require('./routes/doctor');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure required directories exist
['uploads', 'data'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CareBridge AI OPD Assistant Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/session', sessionRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/doctor', doctorRoutes);

// Serve static frontend build in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Handler for unhandled API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(' CareBridge (MediKiosk) Backend running on port ' + PORT);
  console.log(' Health check: http://localhost:' + PORT + '/api/health');
  console.log(' Doctor Queue: http://localhost:' + PORT + '/api/doctor/queue');
  console.log('========================================================');
});
