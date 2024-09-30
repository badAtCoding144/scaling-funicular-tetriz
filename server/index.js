// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this in production for security
    methods: ['GET', 'POST']
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Fallback to React's index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// In-memory storage for game rooms
const gameRooms = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a game room
  socket.on('joinGame', ({ gameId, player }) => {
    socket.join(gameId);
    if (!gameRooms[gameId]) {
      gameRooms[gameId] = { players: {} };
    }
    gameRooms[gameId].players[player] = socket.id;
    console.log(`Player ${player} joined game ${gameId}`);

    // Notify both players when two have joined
    if (Object.keys(gameRooms[gameId].players).length === 2) {
      io.to(gameRooms[gameId].players[1]).emit('startGame', { player: 1 });
      io.to(gameRooms[gameId].players[2]).emit('startGame', { player: 2 });
    }
  });

  // Handle player moves
  socket.on('playerMove', ({ gameId, player, moveData }) => {
    // Broadcast the move to the opponent
    const opponent = player === 1 ? 2 : 1;
    const opponentSocketId = gameRooms[gameId]?.players[opponent];
    if (opponentSocketId) {
      io.to(opponentSocketId).emit('opponentMove', { moveData });
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find and remove the socket from any game rooms
    for (const gameId in gameRooms) {
      for (const player in gameRooms[gameId].players) {
        if (gameRooms[gameId].players[player] === socket.id) {
          delete gameRooms[gameId].players[player];
          // Notify the remaining player
          const remainingPlayer = gameRooms[gameId].players[player === '1' ? '2' : '1'];
          if (remainingPlayer) {
            io.to(remainingPlayer).emit('opponentLeft');
          }
          // Delete the game room if empty
          if (Object.keys(gameRooms[gameId].players).length === 0) {
            delete gameRooms[gameId];
          }
          break;
        }
      }
    }
  });
});

// Define the port
const PORT = process.env.PORT || 3001;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
