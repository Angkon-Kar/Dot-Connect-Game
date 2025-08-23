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

