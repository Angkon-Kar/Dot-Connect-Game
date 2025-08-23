function makeAIMove() {
    const currentPlayer = players[currentPlayerIndex];
    if (!gameActive || currentPlayer.name !== 'Computer') return;

    let bestMove = null;
    const availableMoves = getAvailableMoves();

    // Strategy 1: Complete a box
    for (const move of availableMoves) {
        // Simulate move
        const tempH = JSON.parse(JSON.stringify(horizontalLines));
        const tempV = JSON.parse(JSON.stringify(verticalLines));
        const tempB = JSON.parse(JSON.stringify(boxes));

        if (move.type === 'h') {
            tempH[move.r][move.c] = currentPlayerIndex + 1;
        } else {
            tempV[move.r][move.c] = currentPlayerIndex + 1;
        }

        // Check if this move completes a box
        let simulatedBoxesFormed = 0;
        for (let r = 0; r < numRows - 1; r++) {
            for (let c = 0; c < numCols - 1; c++) {
                if (tempB[r][c] === 0) {
                    const top = tempH[r] && tempH[r][c];
                    const bottom = tempH[r + 1] && tempH[r + 1][c];
                    const left = tempV[r] && tempV[r][c];
                    const right = tempV[r] && tempV[r][c + 1];
                    if (top !== 0 && bottom !== 0 && left !== 0 && right !== 0) {
                        simulatedBoxesFormed++;
                    }
                }
            }
        }

        if (simulatedBoxesFormed > 0) {
            bestMove = move;
            break; // Found a winning move, take it immediately
        }
    }



}