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

