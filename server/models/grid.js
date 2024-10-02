// server/models/grid.js

class Grid {
    constructor(cols = 10, rows = 20) {
      this.cols = cols;
      this.rows = rows;
      this.grid = this.createGrid();
    }
  
    createGrid() {
      return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }
  
    isCellEmpty(x, y) {
      if (x < 0 || x >= this.cols || y >= this.rows) return false;
      if (y < 0) return true; // Allow spawning above the grid
      return this.grid[y][x] === 0;
    }
  
    canPlace(pieceShape, offsetX, offsetY) {
      for (let y = 0; y < pieceShape.length; y++) {
        for (let x = 0; x < pieceShape[y].length; x++) {
          if (pieceShape[y][x] !== 0) {
            const newX = x + offsetX;
            const newY = y + offsetY;
            if (!this.isCellEmpty(newX, newY)) {
              return false;
            }
          }
        }
      }
      return true;
    }
  
    placePiece(pieceShape, offsetX, offsetY, value) {
      for (let y = 0; y < pieceShape.length; y++) {
        for (let x = 0; x < pieceShape[y].length; x++) {
          if (pieceShape[y][x] !== 0) {
            const newX = x + offsetX;
            const newY = y + offsetY;
            if (newY >= 0 && newX >= 0 && newX < this.cols && newY < this.rows) {
              this.grid[newY][newX] = value;
            }
          }
        }
      }
    }
  
    clearLines() {
      let linesCleared = 0;
      for (let y = this.rows - 1; y >= 0; y--) {
        if (this.grid[y].every(cell => cell !== 0)) {
          this.grid.splice(y, 1);
          this.grid.unshift(Array(this.cols).fill(0));
          linesCleared += 1;
          y++; // Recheck the same row after shifting
        }
      }
      return linesCleared;
    }
  
    getGrid() {
      return this.grid;
    }
  }
  
  module.exports = Grid;
  