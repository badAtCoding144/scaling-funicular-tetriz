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

// Event Listeners
createBtn.addEventListener('click', () => {
  socket.emit('createGame');
});

joinBtn.addEventListener('click', () => {
  const id = roomInput.value.trim();
  if (id) {
    socket.emit('joinGame', { roomId: id });
  }
});

// Socket Event Handlers
socket.on('gameCreated', ({ roomId: id }) => {
  roomId = id;
  isPlayer1 = true;
  status.innerText = `Game created! Share Room ID: ${roomId}`;
});

socket.on('gameJoined', ({ roomId: id }) => {
  roomId = id;
  status.innerText = `Joined game: ${roomId}`;
});

socket.on('startGame', ({ roomId: id, players }) => {
  if (id === roomId) {
    menu.style.display = 'none';
    gameDiv.style.display = 'block';
    // Initialize game boards
    initializeGame();
  }
});

socket.on('gameStateUpdate', ({ boards, scores }) => {
  // Update both boards and scores
  // For simplicity, we'll just update the scores here
  // Implement board rendering as needed
  const playerId = socket.id;
  const opponentId = Object.keys(scores).find(id => id !== playerId);

  playerScoreEl.innerText = scores[playerId] || 0;
  opponentScoreEl.innerText = scores[opponentId] || 0;

  // TODO: Render boards using the `boards` data
});

socket.on('playerDisconnected', () => {
  alert('Opponent disconnected. You win by default!');
  location.reload();
});

socket.on('error', ({ message }) => {
  alert(message);
});

// Game Initialization (Placeholder)
function initializeGame() {
  // Initialize your game logic here
  // For example, set up the Tetris game loop, handle user input, etc.
  // This is a complex task and requires a full Tetris implementation
  // Consider using existing Tetris libraries or implementing your own
  playerScoreEl.innerText = '0';
  opponentScoreEl.innerText = '0';

  // Example: Sending game state periodically
  setInterval(() => {
    const fakeBoard = {}; // Replace with actual board state
    const fakeScore = parseInt(playerScoreEl.innerText) + Math.floor(Math.random() * 10);
    playerScoreEl.innerText = fakeScore;
    socket.emit('updateGameState', { roomId, board: fakeBoard, score: fakeScore });
  }, 3000);
}
