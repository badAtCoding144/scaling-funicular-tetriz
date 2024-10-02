// server/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./controllers/gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client/public')));

// Initialize GameManager
const gameManager = new GameManager(io);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
