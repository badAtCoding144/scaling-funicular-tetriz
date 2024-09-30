// server/gameManager.js

const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor(io) {
    this.io = io;
    this.games = {}; // Stores active games
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle creating a new game
      socket.on('createGame', () => {
        const roomId = uuidv4();
        socket.join(roomId);
        this.games[roomId] = {
          players: [socket.id],
          scores: { [socket.id]: 0 },
          boards: {}
        };
        socket.emit('gameCreated', { roomId });
        console.log(`Game created with Room ID: ${roomId}`);
      });

      // Handle joining an existing game
      socket.on('joinGame', ({ roomId }) => {
        const game = this.games[roomId];
        if (game && game.players.length < 2) {
          socket.join(roomId);
          game.players.push(socket.id);
          game.scores[socket.id] = 0;
          socket.emit('gameJoined', { roomId });
          // Notify both players that the game can start
          this.io.to(roomId).emit('startGame', { roomId, players: game.players });
          console.log(`Socket ${socket.id} joined Room ${roomId}`);
        } else {
          socket.emit('error', { message: 'Game not found or already full.' });
        }
      });

      // Handle game state updates
      socket.on('updateGameState', ({ roomId, board, score }) => {
        const game = this.games[roomId];
        if (game) {
          game.boards[socket.id] = board;
          game.scores[socket.id] = score;
          // Broadcast the updated state to both players
          this.io.to(roomId).emit('gameStateUpdate', {
            boards: game.boards,
            scores: game.scores
          });
        }
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Find and clean up the game the socket was part of
        for (const roomId in this.games) {
          const game = this.games[roomId];
          if (game.players.includes(socket.id)) {
            this.io.to(roomId).emit('playerDisconnected');
            delete this.games[roomId];
            break;
          }
        }
      });
    });
  }
}

module.exports = GameManager;
