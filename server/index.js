// server/index.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const gameManager = new GameManager(io);

// Serve static files from the client public directory
app.use(express.static('../client/public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
