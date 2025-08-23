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

    // Strategy 2: Block opponent from completing a box (only considers next human player)
    if (!bestMove) {
        const nextHumanPlayerIndex = (currentPlayerIndex + 1) % players.length;
        let potentialOpponent = players[nextHumanPlayerIndex];
        if (potentialOpponent.name === 'Computer') { // Skip if next is also AI
            potentialOpponent = players[(nextHumanPlayerIndex + 1) % players.length];
        }
        if (potentialOpponent.name !== 'Computer') { // Only block if next is human
            for (const move of availableMoves) {
                const tempH = JSON.parse(JSON.stringify(horizontalLines));
                const tempV = JSON.parse(JSON.stringify(verticalLines));
                
                if (move.type === 'h') {
                    tempH[move.r][move.c] = currentPlayerIndex + 1;
                } else {
                    tempV[move.r][move.c] = currentPlayerIndex + 1;
                }

                let opponentCanScoreNext = false;
                for (let r = 0; r < numRows - 1; r++) {
                    for (let c = 0; c < numCols - 1; c++) {
                        if (boxes[r][c] === 0) { // If box is unowned
                            const top = tempH[r] && tempH[r][c];
                            const bottom = tempH[r + 1] && tempH[r + 1][c];
                            const left = tempV[r] && tempV[r][c];
                            const right = tempV[r] && tempV[r][c + 1];

                            let drawnSides = 0;
                            if (top !== 0) drawnSides++;
                            if (bottom !== 0) drawnSides++;
                            if (left !== 0) drawnSides++;
                            if (right !== 0) drawnSides++;

                            if (drawnSides === 3) { // If only one side is missing, opponent can score
                                opponentCanScoreNext = true;
                                break;
                            }
                        }
                    }
                    if (opponentCanScoreNext) break;
                }

                if (!opponentCanScoreNext) {
                    bestMove = move; // This move doesn't set up opponent for a score
                    break;
                }
            }
        }
    }


    // Strategy 3: Make a random valid move if no strategic move found
    if (!bestMove && availableMoves.length > 0) {
        bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    if (bestMove) {
        // Apply the chosen move
        if (bestMove.type === 'h') {
            horizontalLines[bestMove.r][bestMove.c] = currentPlayerIndex + 1;
        } else {
            verticalLines[bestMove.r][bestMove.c] = currentPlayerIndex + 1;
        }

        const boxesFormed = checkForBoxes();
        if (boxesFormed === 0) {
            switchPlayer();
        }
        updateScoreDisplays();
        updatePlayerTurnDisplay();
        drawGame();
        checkGameOver();
    } else {
        console.warn("AI could not find a move. This should not happen if game is not over.");
    }

}

function getAvailableMoves() {
    const moves = [];
    // Horizontal moves
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            if (horizontalLines[r][c] === 0) {
                moves.push({ type: 'h', r: r, c: c });
            }
        }
    }
    // Vertical moves
    for (let r = 0; r < numRows - 1; r++) {
        for (let c = 0; c < numCols; c++) {
            if (verticalLines[r][c] === 0) {
                moves.push({ type: 'v', r: r, c: c });
            }
        }
    }
    return moves;
}