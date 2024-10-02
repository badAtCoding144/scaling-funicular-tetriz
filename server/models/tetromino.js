// server/models/tetromino.js

class Tetromino {
    constructor(type) {
      this.type = type;
      this.rotations = Tetromino.SHAPES[type];
      this.currentRotation = 0;
      this.shape = this.rotations[this.currentRotation];
    }
  
    rotate(clockwise = true) {
      if (clockwise) {
        this.currentRotation = (this.currentRotation + 1) % this.rotations.length;
      } else {
        this.currentRotation =
          (this.currentRotation - 1 + this.rotations.length) % this.rotations.length;
      }
      this.shape = this.rotations[this.currentRotation];
    }
  
    get current() {
      return this.shape;
    }
  
    static SHAPES = {
      I: [
        [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        [
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
        ],
      ],
      O: [
        [
          [2, 2],
          [2, 2],
        ],
      ],
      T: [
        [
          [0, 3, 0],
          [3, 3, 3],
          [0, 0, 0],
        ],
        [
          [0, 3, 0],
          [0, 3, 3],
          [0, 3, 0],
        ],
        [
          [0, 0, 0],
          [3, 3, 3],
          [0, 3, 0],
        ],
        [
          [0, 3, 0],
          [3, 3, 0],
          [0, 3, 0],
        ],
      ],
      S: [
        [
          [0, 4, 4],
          [4, 4, 0],
          [0, 0, 0],
        ],
        [
          [0, 4, 0],
          [0, 4, 4],
          [0, 0, 4],
        ],
      ],
      Z: [
        [
          [5, 5, 0],
          [0, 5, 5],
          [0, 0, 0],
        ],
        [
          [0, 0, 5],
          [0, 5, 5],
          [0, 5, 0],
        ],
      ],
      J: [
        [
          [6, 0, 0],
          [6, 6, 6],
          [0, 0, 0],
        ],
        [
          [0, 6, 6],
          [0, 6, 0],
          [0, 6, 0],
        ],
        [
          [0, 0, 0],
          [6, 6, 6],
          [0, 0, 6],
        ],
        [
          [0, 6, 0],
          [0, 6, 0],
          [6, 6, 0],
        ],
      ],
      L: [
        [
          [0, 0, 7],
          [7, 7, 7],
          [0, 0, 0],
        ],
        [
          [0, 7, 0],
          [0, 7, 0],
          [0, 7, 7],
        ],
        [
          [0, 0, 0],
          [7, 7, 7],
          [7, 0, 0],
        ],
        [
          [7, 7, 0],
          [0, 7, 0],
          [0, 7, 0],
        ],
      ],
    };
  }
  
  module.exports = Tetromino;
  