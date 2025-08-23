async function showOnlineLobby() {
    hideAllScreens();
    document.getElementById('onlineLobby').classList.remove('hidden');
    gameMode = 'online';
    if (!isAuthReady()) {
        document.getElementById('lobbyUserId').textContent = 'Loading...';
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById('lobbyUserId').textContent = getUserId();
                fetchAvailableGames();
                unsubscribeAuth();
            }
        });
    } else {
        document.getElementById('lobbyUserId').textContent = getUserId();
        fetchAvailableGames();
    }
}

document.getElementById('createGameButton').addEventListener('click', createOnlineGame);
document.getElementById('refreshGamesButton').addEventListener('click', fetchAvailableGames);

async function createOnlineGame() {
    if (!window.firebaseDb || !getUserId()) {
        showCustomAlert("Firebase not initialized or user not authenticated. Please wait.");
        return;
    }

    const numPlayersToCreate = parseInt(document.getElementById('createGameNumPlayers').value);
    const initialPlayers = [];
    for(let i = 0; i < numPlayersToCreate; i++) {
        initialPlayers.push({
            id: null, // Will be filled by joining players
            name: `Player ${i + 1}`,
            score: 0,
            colorClass: playerColors[i],
            lineColor: playerLineColors[i],
            fillColor: playerFillColors[i]
        });
    }

    // Assign creator as Player 1
    initialPlayers[0].id = getUserId();
    initialPlayers[0].name = `Player_${getUserId().substring(0, 6)}`;

    const gameRef = collection(window.firebaseDb, `artifacts/${window.appId}/public/data/games`);
    try {
        const newGameDoc = await addDoc(gameRef, {
            players: JSON.stringify(initialPlayers), // Store players array as JSON string
            gridRows: parseInt(document.getElementById('createGameGridRows').value) || 7,
            gridCols: parseInt(document.getElementById('createGameGridCols').value) || 5,
            horizontalLines: JSON.stringify(Array(parseInt(document.getElementById('createGameGridRows').value) || 7).fill(0).map(() => Array(parseInt(document.getElementById('createGameGridCols').value) - 1 || 4).fill(0))),
            verticalLines: JSON.stringify(Array(parseInt(document.getElementById('createGameGridRows').value) - 1 || 6).fill(0).map(() => Array(parseInt(document.getElementById('createGameGridCols').value) || 5).fill(0))),
            boxes: JSON.stringify(Array(parseInt(document.getElementById('createGameGridRows').value) - 1 || 6).fill(0).map(() => Array(parseInt(document.getElementById('createGameGridCols').value) - 1 || 4).fill(0))),
            currentPlayerIndex: 0, // Player 1 (index 0) starts
            status: 'waiting', // waiting, active, finished
            numPlayers: numPlayersToCreate,
            currentPlayersCount: 1,
            lastMoveBy: null,
            createdAt: new Date().toISOString()
        });
        onlineGameId = newGameDoc.id;
        onlinePlayerNumber = 1; // This user is Player 1 (1-based index)

        // Set local game state for the creator
        players = initialPlayers;
        numRows = parseInt(document.getElementById('createGameGridRows').value) || 7;
        numCols = parseInt(document.getElementById('createGameGridCols').value) || 5;
        horizontalLines = JSON.parse(JSON.stringify(Array(numRows).fill(0).map(() => Array(numCols - 1).fill(0)))); // Re-init based on actual size
        verticalLines = JSON.parse(JSON.stringify(Array(numRows - 1).fill(0).map(() => Array(numCols).fill(0))));
        boxes = JSON.parse(JSON.stringify(Array(numRows - 1).fill(0).map(() => Array(numCols - 1).fill(0))));
        currentPlayerIndex = 0;

        showCustomAlert(`Game created! Share this ID: ${onlineGameId}`);
        listenToOnlineGame(onlineGameId);
        showGameBoard();
    } catch (e) {
        console.error("Error creating online game:", e);
        showCustomAlert("Failed to create game. Please try again.");
    }
}


