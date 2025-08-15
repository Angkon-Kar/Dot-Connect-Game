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

