const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Health check endpoints
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Demo API',
    version: '1.0.0',
    environment: process.env.ENVIRONMENT || 'development'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    application: 'demo-api',
    version: '1.0.0',
    environment: process.env.ENVIRONMENT || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Sample data endpoint
app.get('/api/data', (req, res) => {
  const sampleData = [
    { id: 1, name: 'Item 1', description: 'First sample item' },
    { id: 2, name: 'Item 2', description: 'Second sample item' },
    { id: 3, name: 'Item 3', description: 'Third sample item' }
  ];
  res.json(sampleData);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Demo API listening on port ${port}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health/ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
