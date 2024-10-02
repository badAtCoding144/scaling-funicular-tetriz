// server/controllers/game.js
const { EventEmitter } = require('events');

class Game extends EventEmitter {
  constructor(roomId, io, players) {
    super();
    this.roomId = roomId;
    this.io = io;
    this.players = players; // Array of socket IDs
    this.grids = {}; // socketId: grid
    this.currentPieces = {}; // socketId: current piece
    this.nextPieces = {}; // socketId: next piece
    this.positions = {}; // socketId: position of current piece
    this.scores = {}; // socketId: score
    this.gameInterval = null;

    // Initialize game state for each player
    players.forEach((player) => {
      this.grids[player] = this.createGrid();
      this.currentPieces[player] = this.generateTetromino();
      this.nextPieces[player] = this.generateTetromino();
      this.positions[player] = { 
        x: Math.floor((this.grids[player][0].length - this.currentPieces[player].shape[0].length) / 2), 
        y: 0 
      };
      this.scores[player] = 0;
    });
  }

  // Method to create a blank grid
  createGrid() {
    const COL = 10;
    const ROW = 20;
    return Array.from({ length: ROW }, () => Array(COL).fill(0));
  }

  // Method to generate a random tetromino
  generateTetromino() {
    const tetrominos = [
      [[1, 1, 1, 1]], // I
      [
        [2, 2],
        [2, 2],
      ], // O
      [
        [0, 3, 0],
        [3, 3, 3],
      ], // T
      [
        [0, 4, 4],
        [4, 4, 0],
      ], // S
      [
        [5, 5, 0],
        [0, 5, 5],
      ], // Z
      [
        [6, 0, 0],
        [6, 6, 6],
      ], // J
      [
        [0, 0, 7],
        [7, 7, 7],
      ], // L
    ];
    const shape = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    const color = shape[0].find(c => c !== 0); // Find the first non-zero color
    return { shape, color };
  }

  // Method to start the game loop
  startGameLoop() {
    if (this.gameInterval) return; // Prevent multiple intervals
    this.gameInterval = setInterval(() => {
      // Update game state for each player
      this.players.forEach((playerId) => {
        // Move the current piece down
        const currentPosition = this.positions[playerId];
        const currentPiece = this.currentPieces[playerId];
        const newY = currentPosition.y + 1;

        // Check collision at the new position
        if (this.checkCollision(playerId, currentPosition.x, newY, currentPiece.shape)) {
          // Lock the piece into the grid
          this.lockPiece(playerId);

          // Generate new piece
          this.currentPieces[playerId] = this.nextPieces[playerId];
          this.nextPieces[playerId] = this.generateTetromino();

          // Reset position
          this.positions[playerId].y = 0;

          // Update score, e.g., +100 for locking a piece
          this.scores[playerId] += 100;
        } else {
          // No collision, update position
          this.positions[playerId].y = newY;
        }

        // Emit the updated game state to all players in the room
        this.io.to(this.roomId).emit('gameStateUpdate', {
          grids: this.grids,
          positions: this.positions,
          currentPieces: this.currentPieces,
          nextPieces: this.nextPieces,
          scores: this.scores,
        });
      });
    }, 1000); // Update every second
    console.log(`Game loop started for room ${this.roomId}`);
  }

  // Method to stop the game loop
  stopGameLoop() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
      console.log(`Game loop stopped for room ${this.roomId}`);
    }
  }

  // Method to handle player input
  handlePlayerInput(playerId, input) {
    const { x, y } = this.positions[playerId];
    const currentPiece = this.currentPieces[playerId].shape;

    switch (input) {
      case 'moveLeft':
        if (!this.checkCollision(playerId, x - 1, y, currentPiece)) {
          this.positions[playerId].x -= 1;
        }
        break;
      case 'moveRight':
        if (!this.checkCollision(playerId, x + 1, y, currentPiece)) {
          this.positions[playerId].x += 1;
        }
        break;
      case 'softDrop':
        if (!this.checkCollision(playerId, x, y + 1, currentPiece)) {
          this.positions[playerId].y += 1;
          this.scores[playerId] += 10; // Example scoring for soft drop
        }
        break;
      case 'rotate':
        this.rotatePiece(playerId);
        break;
      case 'hardDrop':
        while (!this.checkCollision(playerId, this.positions[playerId].x, this.positions[playerId].y + 1, currentPiece)) {
          this.positions[playerId].y += 1;
          this.scores[playerId] += 10; // Example scoring for hard drop
        }
        this.lockPiece(playerId);
        this.currentPieces[playerId] = this.nextPieces[playerId];
        this.nextPieces[playerId] = this.generateTetromino();
        this.positions[playerId].y = 0;
        break;
      default:
        break;
    }

    // Emit the updated game state after handling input
    this.io.to(this.roomId).emit('gameStateUpdate', {
      grids: this.grids,
      positions: this.positions,
      currentPieces: this.currentPieces,
      nextPieces: this.nextPieces,
      scores: this.scores,
    });
  }

  // Method to rotate a piece
  rotatePiece(playerId) {
    const currentPiece = this.currentPieces[playerId].shape;
    const rotatedShape = this.rotateMatrix(currentPiece);

    if (!this.checkCollision(playerId, this.positions[playerId].x, this.positions[playerId].y, rotatedShape)) {
      this.currentPieces[playerId].shape = rotatedShape;
    }
  }

  // Helper function to rotate a matrix (90 degrees clockwise)
  rotateMatrix(matrix) {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
  }

  // Method to check collision
  checkCollision(playerId, x, y, shape) {
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx] !== 0) {
          const newX = x + dx;
          const newY = y + dy;

          // Check boundaries
          if (newX < 0 || newX >= this.grids[playerId][0].length || newY >= this.grids[playerId].length) {
            return true; // Collision with wall or floor
          }

          // Check collision with existing locked pieces
          if (newY >= 0 && this.grids[playerId][newY][newX] !== 0) {
            return true;
          }
        }
      }
    }

    return false; // No collision
  }

  // Method to lock a piece into the grid
  lockPiece(playerId) {
    const { x, y } = this.positions[playerId];
    const shape = this.currentPieces[playerId].shape;
    const color = this.currentPieces[playerId].color;

    shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value !== 0) {
          const gridX = x + dx;
          const gridY = y + dy;
          if (gridY >= 0 && gridY < this.grids[playerId].length && gridX >= 0 && gridX < this.grids[playerId][0].length) {
            this.grids[playerId][gridY][gridX] = color;
          }
        }
      });
    });

    // Check and clear complete lines
    let linesCleared = 0;
    this.grids[playerId] = this.grids[playerId].filter(row => {
      if (row.every(cell => cell !== 0)) {
        linesCleared += 1;
        return false; // Remove the complete line
      }
      return true; // Keep the incomplete line
    });

    // Add empty lines at the top
    while (this.grids[playerId].length < 20) {
      this.grids[playerId].unshift(Array(10).fill(0));
    }

    // Update score based on lines cleared
    const pointsPerLine = [0, 100, 300, 500, 800]; // 1 to 4 lines
    this.scores[playerId] += pointsPerLine[linesCleared] || 0;
  }
}

module.exports = Game;
