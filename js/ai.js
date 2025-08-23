function makeAIMove() {
    const currentPlayer = players[currentPlayerIndex];
    if (!gameActive || currentPlayer.name !== 'Computer') return;

    let bestMove = null;
    const availableMoves = getAvailableMoves();



}