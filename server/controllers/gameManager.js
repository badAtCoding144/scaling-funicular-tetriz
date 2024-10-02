// server/controllers/gameManager.js
const { v4: uuidv4 } = require('uuid');
const Game = require('./game');

class GameManager {
  constructor(io) {
    this.io = io;
    this.games = {}; // roomId: Game instance

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle creating a new game
      socket.on('createGame', () => {
        const roomId = uuidv4();
        socket.join(roomId);
        const game = new Game(roomId, this.io, [socket.id]);
        this.games[roomId] = game;
        socket.emit('gameCreated', { roomId });
        console.log(`Game created with Room ID: ${roomId}`);
      });

      // Handle joining an existing game
      socket.on('joinGame', ({ roomId }) => {
        const game = this.games[roomId];
        if (game && game.players.length < 2) {
          socket.join(roomId);
          game.players.push(socket.id);
          game.grids[socket.id] = game.createGrid(); // Initialize grid for the new player
          game.currentPieces[socket.id] = game.generateTetromino();
          game.nextPieces[socket.id] = game.generateTetromino();
          game.positions[socket.id] = { 
            x: Math.floor((game.grids[socket.id][0].length - game.currentPieces[socket.id].shape[0].length) / 2), 
            y: 0 
          };
          game.scores[socket.id] = 0;
          this.io.to(roomId).emit('startGame', { roomId, players: game.players });
          
          // If two players are present, start the game loop
          if (game.players.length === 2) {
            game.startGameLoop();
          }
          console.log(`Socket ${socket.id} joined Room ${roomId}`);
        } else {
          socket.emit('error', { message: 'Game not found or already full.' });
          console.log(`Socket ${socket.id} failed to join Room ${roomId}: Game not found or already full.`);
        }
      });

      // Handle player inputs
      socket.on('playerInput', ({ roomId, input }) => {
        const game = this.games[roomId];
        if (game && game.players.includes(socket.id)) {
          game.handlePlayerInput(socket.id, input);
          console.log(`Received input from ${socket.id} in Room ${roomId}: ${input}`);
        } else {
          console.log(`Invalid input from ${socket.id} for Room ${roomId}`);
        }
      });

      // Handle game over
      socket.on('gameOver', ({ roomId, score }) => {
        const game = this.games[roomId];
        if (game) {
          // Update the score
          game.scores[socket.id] = score;
          // Notify both players about the game over
          this.io.to(roomId).emit('gameOver', { message: `Player ${socket.id} has lost the game!`, scores: game.scores });
          // Clean up the game
          game.stopGameLoop();
          delete this.games[roomId];
          console.log(`Game ${roomId} has ended.`);
        }
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Find and clean up the game the socket was part of
        for (const roomId in this.games) {
          const game = this.games[roomId];
          if (game.players.includes(socket.id)) {
            this.io.to(roomId).emit('playerDisconnected', { message: 'Opponent has disconnected. Game over.' });
            game.stopGameLoop();
            delete this.games[roomId];
            console.log(`Game ${roomId} has been terminated due to player disconnection.`);
            break;
          }
        }
      });
    })
  }
}

module.exports = GameManager;
