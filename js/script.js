// Screen Management Functions
function hideAllScreens() {
    document.getElementById('modeSelection').classList.add('hidden');
    document.getElementById('gameSetup').classList.add('hidden');
    document.getElementById('onlineLobby').classList.add('hidden');
    document.getElementById('gameBoard').classList.add('hidden');
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('customAlertModal').classList.add('hidden');
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); // Stop listening to old game data
        unsubscribeSnapshot = null;
    }
}

function showModeSelectionScreen() {
    hideAllScreens();
    document.getElementById('modeSelection').classList.remove('hidden');
    gameActive = false;
    canvas.removeEventListener('pointerdown', handleCanvasClick);
    const currentUserIdDisplay = document.getElementById('currentUserId');
    if (window.isAuthReady()) {
        currentUserIdDisplay.textContent = `Your ID: ${getUserId()}`;
    } else {
        currentUserIdDisplay.textContent = `Your ID: Loading...`;
    }
}

function showSetupScreen(mode) {
    hideAllScreens();
    document.getElementById('gameSetup').classList.remove('hidden');
    gameMode = mode;
    if (mode === 'local') {
        document.getElementById('setupTitle').textContent = 'Local Game Setup';
        document.getElementById('numPlayersSelect').value = '2'; // Default to 2 players for local
        document.getElementById('numPlayersSelect').disabled = false;
    } else if (mode === 'ai') {
        document.getElementById('setupTitle').textContent = 'Player vs AI Setup';
        document.getElementById('numPlayersSelect').value = '2'; // AI is always 2 players (1 human, 1 AI)
        document.getElementById('numPlayersSelect').disabled = true; // Cannot change number of players for AI mode
    }
    updatePlayerNameInputs(); // Initialize player name inputs
}

function updatePlayerNameInputs() {
    const numPlayers = parseInt(document.getElementById('numPlayersSelect').value);
    const playerInputsContainer = document.getElementById('playerInputs');
    playerInputsContainer.innerHTML = ''; // Clear existing inputs

    for (let i = 0; i < numPlayers; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `playerName${i + 1}`;
        input.className = 'input-field';
        input.value = `Player ${i + 1}`;
        if (gameMode === 'ai' && i === 1) { // Player 2 is AI
            input.value = 'Computer';
            input.readOnly = true;
        }
        playerInputsContainer.appendChild(input);
    }
}

function showGameBoard() {
    hideAllScreens();

    document.getElementById('gameBoard').classList.remove('hidden');
    gameActive = true;
    resizeCanvas();
    canvas.removeEventListener('pointerdown', handleCanvasClick);
    canvas.addEventListener('pointerdown', handleCanvasClick);
    drawGame();
}

function handleGoBack() {
    if (gameMode === 'online') {
        if (onlineGameId) {
            showCustomAlert('Leaving an online game will forfeit your progress. Are you sure?', () => {
                leaveOnlineGame();
                showOnlineLobby();
            }, true);
        } else {
            showOnlineLobby();
        }
    } else {
        showModeSelectionScreen();
    }
}

function startGame() {
    const numPlayers = parseInt(document.getElementById('numPlayersSelect').value);
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const nameInput = document.getElementById(`playerName${i + 1}`);
        players.push({
            id: gameMode === 'online' ? null : `localPlayer${i+1}`, // ID will be set for online later
            name: nameInput.value.trim() || `Player ${i + 1}`,
            score: 0,
            colorClass: playerColors[i],
            lineColor: playerLineColors[i],
            fillColor: playerFillColors[i]
        });
    }

    numRows = parseInt(document.getElementById('gridRows').value);
    numCols = parseInt(document.getElementById('gridCols').value);

    if (isNaN(numRows) || isNaN(numCols) || numRows < 2 || numCols < 2) {
        showCustomAlert('Please enter valid grid dimensions (minimum 2x2).');
        return;
    }

    horizontalLines = Array(numRows).fill(0).map(() => Array(numCols - 1).fill(0));
    verticalLines = Array(numRows - 1).fill(0).map(() => Array(numCols).fill(0));
    boxes = Array(numRows - 1).fill(0).map(() => Array(numCols - 1).fill(0));

    currentPlayerIndex = 0; // First player starts (index 0)

    onlineGameId = null;
    onlinePlayerNumber = null;

    showGameBoard();

    updateScoreDisplays(); // Update all player scores
    updatePlayerTurnDisplay();

    if (gameMode === 'ai' && players[currentPlayerIndex].name === 'Computer') {
        setTimeout(makeAIMove, 700);
    }
}



