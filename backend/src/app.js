require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error({ event: 'unhandled_error', message: err.message, stack: err.stack });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log({ event: 'db_connected' });
    app.listen(PORT, () => console.log({ event: 'server_started', port: PORT }));
  })
  .catch((err) => {
    console.error({ event: 'db_connect_failed', message: err.message });
    process.exit(1);
  });

module.exports = app;
