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

async function fetchAvailableGames() {
    if (!window.firebaseDb || !isAuthReady()) {
        document.getElementById('availableGamesList').innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">Loading Firebase...</td></tr>';
        return;
    }
    document.getElementById('availableGamesList').innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">Loading games...</td></tr>';

    const gamesCol = collection(window.firebaseDb, `artifacts/${window.appId}/public/data/games`);
    // Query for games that are waiting and have less than max players
    const q = query(gamesCol, where("status", "==", "waiting"));

    try {
        const querySnapshot = await getDocs(q);
        let gamesHtml = '';
        let joinableGamesFound = false;

        querySnapshot.forEach((doc) => {
            const game = doc.data();
            const gamePlayers = JSON.parse(game.players);
            const currentPlayersCount = gamePlayers.filter(p => p.id !== null).length;

            // Don't show games you created if they are already full or you are in them
            if (gamePlayers.some(p => p.id === getUserId())) return;

            if (currentPlayersCount < game.numPlayers) {
                joinableGamesFound = true;
                const playerNames = gamePlayers.map(p => p.name || 'Empty').join(', ');
                gamesHtml += `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${playerNames}</td>
                        <td>${game.gridRows}x${game.gridCols}</td>
                        <td>${currentPlayersCount}/${game.numPlayers}</td>
                        <td><button class="button-primary px-3 py-1 text-sm" onclick="joinOnlineGame('${doc.id}')">Join</button></td>
                    </tr>
                `;
            }
        });
        document.getElementById('availableGamesList').innerHTML = gamesHtml || '<tr><td colspan="5" class="text-center text-gray-500">No joinable games available.</td></tr>';

        // Also fetch and display active games for watching
        const activeQ = query(gamesCol, where("status", "==", "active"));
        const activeSnapshot = await getDocs(activeQ);
        let activeGamesHtml = '';
        if (!activeSnapshot.empty) {
            activeGamesHtml += '<h2 class="text-2xl font-semibold text-gray-700 mt-6">Active Games (Watch)</h2>';
            activeGamesHtml += '<table class="lobby-table"><thead><tr><th>Game ID</th><th>Players</th><th>Size</th><th>Action</th></tr></thead><tbody>';
            activeSnapshot.forEach((doc) => {
                const game = doc.data();
                const gamePlayers = JSON.parse(game.players);
                const playerNames = gamePlayers.map(p => p.name).join(' vs ');
                activeGamesHtml += `
                    <tr>
                        <td>${doc.id}</td>
                        <td>${playerNames}</td>
                        <td>${game.gridRows}x${game.gridCols}</td>
                        <td><button class="button-primary bg-yellow-500 hover:bg-yellow-600 px-3 py-1 text-sm" onclick="watchOnlineGame('${doc.id}')">Watch</button></td>
                    </tr>
                `;
            });
            activeGamesHtml += '</tbody></table>';
        }
        const activeGamesContainer = document.getElementById('activeGamesContainer');
        if (activeGamesContainer) {
            activeGamesContainer.innerHTML = activeGamesHtml;
        }

    } catch (e) {
        console.error("Error fetching available games:", e);
        document.getElementById('availableGamesList').innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Error loading games.</td></tr>';
    }
}
window.fetchAvailableGames = fetchAvailableGames;


async function joinOnlineGame(gameId) {
    if (!window.firebaseDb || !getUserId()) {
        showCustomAlert("Firebase not initialized or user not authenticated. Please wait.");
        return;
    }

    const gameDocRef = doc(window.firebaseDb, `artifacts/${window.appId}/public/data/games`, gameId);
    try {
        const gameDoc = await getDoc(gameDocRef);
        if (!gameDoc.exists()) {
            showCustomAlert("Game not found or already started.");
            fetchAvailableGames();
            return;
        }
        const gameData = gameDoc.data();
        let currentPlayers = JSON.parse(gameData.players);

        if (gameData.status !== 'waiting') {
            showCustomAlert("This game has already started or finished.");
            fetchAvailableGames();
            return;
        }

        // Find the first empty slot
        let joinedPlayerIndex = -1;
        for (let i = 0; i < currentPlayers.length; i++) {
            if (currentPlayers[i].id === null) {
                currentPlayers[i].id = getUserId();
                currentPlayers[i].name = `Player_${getUserId().substring(0, 6)}`;
                joinedPlayerIndex = i;
                break;
            }
        }

        if (joinedPlayerIndex === -1) {
            showCustomAlert("This game is full.");
            fetchAvailableGames();
            return;
        }

        const newPlayersCount = currentPlayers.filter(p => p.id !== null).length;
        const newStatus = (newPlayersCount === gameData.numPlayers) ? 'active' : 'waiting';

        await updateDoc(gameDocRef, {
            players: JSON.stringify(currentPlayers),
            currentPlayersCount: newPlayersCount,
            status: newStatus
        });

        onlineGameId = gameId;
        onlinePlayerNumber = joinedPlayerIndex + 1; // 1-based index
        players = currentPlayers; // Update local players array

        numRows = gameData.gridRows;
        numCols = gameData.gridCols;
        horizontalLines = JSON.parse(gameData.horizontalLines);
        verticalLines = JSON.parse(gameData.verticalLines);
        boxes = JSON.parse(gameData.boxes);
        currentPlayerIndex = gameData.currentPlayerIndex;

        showGameBoard();
        listenToOnlineGame(gameId);
    } catch (e) {
        console.error("Error joining game:", e);
        showCustomAlert("Failed to join game. Please try again.");
    }
}
window.joinOnlineGame = joinOnlineGame;



