const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const venueRoutes = require('./routes/venue.routes');
const queueRoutes = require('./routes/queue.routes');
const tokenRoutes = require('./routes/token.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Smart Queue API is running 🚀' }));

module.exports = app;
