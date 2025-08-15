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

// Resize canvas to fit window
function resizeCanvas() {
    const currentRows = numRows || parseInt(document.getElementById('gridRows').value);
    const currentCols = numCols || parseInt(document.getElementById('gridCols').value);

    canvas.width = (currentCols - 1) * cellSize + 2 * padding;
    canvas.height = (currentRows - 1) * cellSize + 2 * padding;

    const containerWidth = document.getElementById('gameBoard').clientWidth - (2 * parseFloat(getComputedStyle(document.getElementById('gameBoard')).paddingLeft));
    const containerHeight = document.getElementById('gameBoard').clientHeight - (2 * parseFloat(getComputedStyle(document.getElementById('gameBoard')).paddingTop));

    const aspectRatio = canvas.width / canvas.height;

    if (canvas.width > containerWidth || canvas.height > containerHeight) {
        if (containerWidth / aspectRatio < containerHeight) {
            canvas.width = containerWidth;
            canvas.height = containerWidth / aspectRatio;
        } else {
            canvas.height = containerHeight;
            canvas.width = containerHeight * aspectRatio;
        }
    }
    if (gameActive) {
        drawGame();
    }
}

function drawGame() {
    if (!ctx || !gameActive || !boxes || boxes.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBoxes();
    drawLines();
    drawDots();
}

function drawDots() {
    ctx.fillStyle = '#4a5568';
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const x = padding + c * cellSize;
            const y = padding + r * cellSize;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawLines() {
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            const playerNum = horizontalLines[r] && horizontalLines[r][c];
            if (playerNum > 0) { // Player numbers are 1-based
                ctx.strokeStyle = playerLineColors[playerNum - 1];
                ctx.beginPath();
                ctx.moveTo(padding + c * cellSize + dotRadius, padding + r * cellSize);
                ctx.lineTo(padding + (c + 1) * cellSize - dotRadius, padding + r * cellSize);
                ctx.stroke();
            }
        }
    }

    for (let r = 0; r < numRows - 1; r++) {
        for (let c = 0; c < numCols; c++) {
            const playerNum = verticalLines[r] && verticalLines[r][c];
            if (playerNum > 0) { // Player numbers are 1-based
                ctx.strokeStyle = playerLineColors[playerNum - 1];
                ctx.beginPath();
                ctx.moveTo(padding + c * cellSize, padding + r * cellSize + dotRadius);
                ctx.lineTo(padding + c * cellSize, padding + (r + 1) * cellSize - dotRadius);
                ctx.stroke();
            }
        }
    }

}

function drawBoxes() {
    for (let r = 0; r < numRows - 1; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            const playerNum = boxes[r] && boxes[r][c];
            if (playerNum > 0) { // Player numbers are 1-based
                ctx.fillStyle = playerFillColors[playerNum - 1];
                ctx.fillRect(
                    padding + c * cellSize + lineThickness / 2,
                    padding + r * cellSize + lineThickness / 2,
                    cellSize - lineThickness,
                    cellSize - lineThickness
                );
            }
        }
    }
}

function checkForBoxes() {
    let boxesFormedThisTurn = 0;
    const currentPlayerNumber = currentPlayerIndex + 1; // 1-based player number

    for (let r = 0; r < numRows - 1; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            if (boxes[r][c] === 0) {
                const top = horizontalLines[r] && horizontalLines[r][c];
                const bottom = horizontalLines[r + 1] && horizontalLines[r + 1][c];
                const left = verticalLines[r] && verticalLines[r][c];
                const right = verticalLines[r] && verticalLines[r][c + 1];

                if (top !== 0 && bottom !== 0 && left !== 0 && right !== 0) {
                    boxes[r][c] = currentPlayerNumber; // Assign ownership
                    players[currentPlayerIndex].score++;
                    boxesFormedThisTurn++;
                }
            }
        }
    }
    return boxesFormedThisTurn;
}
