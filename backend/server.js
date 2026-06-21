require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket/queue.socket');
const initDb = require('./src/config/initDb');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.io to the same HTTP server
initSocket(server);

// Create tables if they don't exist, then start listening
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});