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