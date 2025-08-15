// Game state variables
let canvas, ctx;
let numRows, numCols;
let dotRadius = 6;
let lineThickness = 4;
let cellSize = 50; // Distance between dots
let padding = 20; // Padding around the grid

let horizontalLines = []; // Stores state of horizontal lines: 0=undrawn, 1=player1, 2=player2
let verticalLines = [];   // Stores state of vertical lines: 0=undrawn, 1=player1, 2=player2
let boxes = [];           // Stores owner of boxes: 0=unowned, 1=player1, 2=player2

let players = []; // Array of player objects: [{id: '...', name: '...', score: 0, colorClass: 'player-color-1'}, ...]
let currentPlayerIndex; // Index in the players array for the current turn

let gameActive = false;
let gameMode = null; // 'local', 'online', 'ai'
let onlineGameId = null; // For online games
let onlinePlayerNumber = null; // 1-based index (1, 2, 3, 4) for the current user in online games
let unsubscribeSnapshot = null; // To unsubscribe from Firestore listener

// Player colors mapping (CSS class names)
const playerColors = [
    'player-color-1', // Player 1
    'player-color-2', // Player 2
    'player-color-3', // Player 3
    'player-color-4'  // Player 4
];
const playerTextColors = [
    'player-text-1',
    'player-text-2',
    'player-text-3',
    'player-text-4'
];
const playerFillColors = [
    'rgba(59, 130, 246, 0.3)', // Player 1 Blue
    'rgba(239, 68, 68, 0.3)',  // Player 2 Red
    'rgba(34, 197, 94, 0.3)',  // Player 3 Green
    'rgba(168, 85, 247, 0.3)'  // Player 4 Purple
];
const playerLineColors = [
    '#3b82f6', // Player 1 Blue
    '#ef4444',  // Player 2 Red
    '#22c55e',  // Player 3 Green
    '#a855f7'   // Player 4 Purple
];

// Initialize game
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    showModeSelectionScreen(); // Start with mode selection
};

