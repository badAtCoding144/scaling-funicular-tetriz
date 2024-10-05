// client/public/client.js

const socket = io();

// DOM Elements
const menu = document.getElementById('menu');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const status = document.getElementById('status');

const gameDiv = document.getElementById('game');
const playerCanvas = document.getElementById('playerBoard');
const opponentCanvas = document.getElementById('opponentBoard');
const playerScoreEl = document.getElementById('playerScore');
const opponentScoreEl = document.getElementById('opponentScore');

let roomId;
let isPlayer1 = false;

// Canvas Contexts
const playerCtx = playerCanvas.getContext('2d');
const opponentCtx = opponentCanvas.getContext('2d');

const BLOCK_SIZE = 20;

// Colors corresponding to tetromino types
const COLORS = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

// Listen for creating a new game
createBtn.addEventListener('click', () => {
  socket.emit('createGame');
  console.log('Sent createGame event.');
});

// Listen for joining a game
joinBtn.addEventListener('click', () => {
  const id = roomInput.value.trim();
  if (id) {
    socket.emit('joinGame', { roomId: id });
    console.log(`Sent joinGame event with Room ID: ${id}`);
  } else {
    alert('Please enter a valid Room ID.');
  }
});

// Handle game creation
socket.on('gameCreated', ({ roomId: id }) => {
  roomId = id;
  isPlayer1 = true;
  status.innerText = `Game created! Share Room ID: ${roomId}`;
  console.log(`Game created with Room ID: ${roomId}`);
});

// Handle game joining
socket.on('gameJoined', ({ roomId: id, players }) => {
  roomId = id;
  status.innerText = `Joined game: ${roomId}`;
  console.log(`Joined game with Room ID: ${roomId}`);
  console.log(`Current Players in Room: ${players}`);
});

// Handle start game
socket.on('startGame', ({ roomId: id, players }) => {
  console.log(`Received startGame for Room ID: ${id}`);
  console.log(`Players in Game: ${players}`);
  if (id === roomId) {
    console.log('Room ID matches. Transitioning to game view.');
    menu.style.display = 'none';
    gameDiv.style.display = 'flex';
    initializeGame();
    console.log('Game started.');
  } else {
    console.log('Room ID does not match. Ignoring startGame event.');
  }
});

// Handle game state updates
socket.on('gameStateUpdate', (gameState) => {
  console.log('Received gameStateUpdate:', gameState);
  renderGameState(gameState);
});

// Handle game over
socket.on('gameOver', ({ message, scores }) => {
  alert(message);
  playerScoreEl.innerText = scores[socket.id] || 0;
  opponentScoreEl.innerText = scores[getOpponentId(scores)] || 0;
  resetGame();
  console.log('Game over:', message);
});

// Handle player disconnection
socket.on('playerDisconnected', ({ message }) => {
  alert(message);
  resetGame();
  console.log('Player disconnected:', message);
});

// Handle errors
socket.on('error', ({ message }) => {
  alert(message);
  console.log('Error:', message);
});

// Handle connection errors
socket.on('connect_error', (err) => {
  console.error('Connection Error:', err.message);
  alert('Failed to connect to the server.');
});

// Function to get opponent's ID
function getOpponentId(scores) {
  return Object.keys(scores).find((id) => id !== socket.id);
}

// Initialize the game
function initializeGame() {
  // Any initialization logic if needed
  // Start listening for keyboard inputs
  document.addEventListener('keydown', handleKeyPress);
  console.log('Game initialized and ready for inputs.');
}

// Reset the game
function resetGame() {
  // Clear canvases
  clearCanvas(playerCtx, playerCanvas);
  clearCanvas(opponentCtx, opponentCanvas);

  // Reset scores
  playerScoreEl.innerText = '0';
  opponentScoreEl.innerText = '0';

  // Remove keyboard listeners
  document.removeEventListener('keydown', handleKeyPress);

  // Show menu
  gameDiv.style.display = 'none';
  menu.style.display = 'block';
  console.log('Game reset and returned to menu.');
}

// Handle keyboard inputs
function handleKeyPress(event) {
  const inputs = {
    ArrowLeft: 'moveLeft',
    ArrowRight: 'moveRight',
    ArrowDown: 'softDrop',
    ArrowUp: 'rotate',
    ' ': 'hardDrop',
  };

  const input = inputs[event.key];
  if (input && roomId) {
    socket.emit('playerInput', { roomId, input });
    console.log(`Sent playerInput: ${input}`);
  }
}

// Render the game state
function renderGameState(gameState) {
  const { grids, positions, currentPieces, nextPieces, scores } = gameState;

  // Identify player's and opponent's IDs
  const playerId = socket.id;
  const opponentId = getOpponentId(scores);

  // Render player's grid
  if (grids[playerId] && positions[playerId] && currentPieces[playerId]) {
    renderGrid(playerCtx, grids[playerId], positions[playerId], currentPieces[playerId]);
  }

  // Render opponent's grid
  if (grids[opponentId] && positions[opponentId] && currentPieces[opponentId]) {
    renderGrid(opponentCtx, grids[opponentId], positions[opponentId], currentPieces[opponentId]);
  }

  // Update scores
  playerScoreEl.innerText = scores[playerId] || 0;
  opponentScoreEl.innerText = scores[opponentId] || 0;
}

// Render individual grid
function renderGrid(ctx, grid, position, currentPiece) {
  clearCanvas(ctx, ctx.canvas);

  // Draw the grid
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 0) {
        ctx.fillStyle = COLORS[grid[y][x]];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  // Draw the current piece
  if (currentPiece && position) {
    const { shape, color } = currentPiece;
    ctx.fillStyle = COLORS[color];
    shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value !== 0) {
          const x = (position.x || 0) + dx;
          const y = (position.y || 0) + dy;
          if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) { // Only draw if within grid
            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          }
        }
      });
    });
  }
}

// Clear the canvas
function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
