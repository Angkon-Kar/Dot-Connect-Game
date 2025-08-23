// Global game state variables (assumed from game.js and script.js)
// let numRows, numCols, horizontalLines, verticalLines, boxes, players, currentPlayerIndex, gameActive;
// function checkForBoxes(), switchPlayer(), updateScoreDisplays(), updatePlayerTurnDisplay(), drawGame(), checkGameOver(), showCustomAlert();

/**
 * Calculates the number of boxes that would become 3-sided after a given move.
 * This function is kept for consistency but the main logic for 3-sided checks is in simulateMove.
 * @param {Array<Array<number>>} tempH - Simulated horizontal lines state.
 * @param {Array<Array<number>>} tempV - Simulated vertical lines state.
 * @param {Array<Array<number>>} currentBoxes - Current boxes state to only count unowned boxes.
 * @returns {number} The count of newly created 3-sided boxes.
 */
function countThreeSidedBoxesAfterMove(tempH, tempV, currentBoxes) {
    let threeSidedCount = 0;
    for (let r = 0; r < numRows - 1; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            if (currentBoxes[r][c] === 0) { // Only consider unowned boxes
                const top = tempH[r]?.[c] || 0;
                const bottom = tempH[r + 1]?.[c] || 0;
                const left = tempV[r]?.[c] || 0;
                const right = tempV[r]?.[c + 1] || 0;

                const drawnSides = (top !== 0) + (bottom !== 0) + (left !== 0) + (right !== 0);
                if (drawnSides === 3) {
                    threeSidedCount++;
                }
            }
        }
    }
    return threeSidedCount;
}

/**
 * Simulates a move and calculates the immediate score change and if it creates any 3-sided boxes.
 * @param {Object} move - The move to simulate ({ type: 'h'|'v', r, c }).
 * @param {Array<Array<number>>} hLines - Current horizontal lines.
 * @param {Array<Array<number>>} vLines - Current vertical lines.
 * @param {Array<Array<number>>} bBoxes - Current boxes.
 * @param {number} playerNum - The 1-based player number making the move.
 * @returns {{score: number, createsThreeSided: boolean, newHLines: Array<Array<number>>, newVLines: Array<Array<number>>}} Simulation result.
 */
function simulateMove(move, hLines, vLines, bBoxes, playerNum) {
    const tempH = JSON.parse(JSON.stringify(hLines));
    const tempV = JSON.parse(JSON.stringify(vLines));
    // tempB is not deeply copied here because we are only checking the current state of ownership
    // and not changing it within this simulation.
    const tempB = bBoxes; 

    if (move.type === 'h') {
        tempH[move.r][move.c] = playerNum;
    } else {
        tempV[move.r][move.c] = playerNum;
    }

    let boxesFormed = 0;
    let createsThreeSided = false;

    // Check boxes potentially affected by this move
    const affectedBoxes = [];
    if (move.type === 'h') {
        if (move.r > 0) affectedBoxes.push({ r: move.r - 1, c: move.c }); // Box above
        if (move.r < numRows - 1) affectedBoxes.push({ r: move.r, c: move.c }); // Box below
    } else {
        if (move.c > 0) affectedBoxes.push({ r: move.r, c: move.c - 1 }); // Box to the left
        if (move.c < numCols - 1) affectedBoxes.push({ r: move.r, c: move.c }); // Box to the right
    }

    for (const boxCoord of affectedBoxes) {
        const r = boxCoord.r;
        const c = boxCoord.c;

        if (r >= 0 && r < numRows - 1 && c >= 0 && c < numCols - 1 && tempB[r][c] === 0) {
            const top = tempH[r]?.[c] || 0;
            const bottom = tempH[r + 1]?.[c] || 0;
            const left = tempV[r]?.[c] || 0;
            const right = tempV[r]?.[c + 1] || 0;

            const drawnSides = (top !== 0) + (bottom !== 0) + (left !== 0) + (right !== 0);

            if (drawnSides === 4) {
                boxesFormed++;
            } else if (drawnSides === 3) {
                createsThreeSided = true;
            }
        }
    }

    return { score: boxesFormed, createsThreeSided: createsThreeSided, newHLines: tempH, newVLines: tempV };
}

/**
 * Retrieves all currently available (undrawn) line moves.
 * @returns {Array<Object>} An array of available moves, each with type ('h' or 'v'), row, and column.
 */
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

/**
 * Calculates the length of a chain starting from a given 3-sided box.
 * A chain means taking one box immediately leads to another 3-sided box being formed.
 * This is a simplified DFS/BFS for chains of 2-sided boxes.
 * @param {Array<Array<number>>} hLinesState - Current horizontal lines state.
 * @param {Array<Array<number>>} vLinesState - Current vertical lines state.
 * @param {Array<Array<number>>} bBoxesState - Current boxes state (to know what's owned/unowned).
 * @param {number} startR - Row of the initial 3-sided box.
 * @param {number} startC - Column of the initial 3-sided box.
 * @param {Set<string>} visitedBoxes - To prevent infinite loops in chains.
 * @returns {number} The length of the chain.
 */
function calculateChainLength(hLinesState, vLinesState, bBoxesState, startR, startC, visitedBoxes) {
    const key = `${startR},${startC}`;
    if (visitedBoxes.has(key)) {
        return 0; // Already counted as part of another chain or this one
    }
    visitedBoxes.add(key);

    // Ensure the starting box is actually a 3-sided unowned box
    if (startR < 0 || startR >= numRows - 1 || startC < 0 || startC >= numCols - 1 || bBoxesState[startR][startC] !== 0) {
        return 0;
    }

    const top = hLinesState[startR]?.[startC] || 0;
    const bottom = hLinesState[startR + 1]?.[startC] || 0;
    const left = vLinesState[startR]?.[startC] || 0;
    const right = vLinesState[startR]?.[startC + 1] || 0;
    const drawnSides = (top !== 0) + (bottom !== 0) + (left !== 0) + (right !== 0);

    if (drawnSides !== 3) {
        return 0; // Not a 3-sided box to start a chain from
    }

    let chainLength = 1; // Count the current box

    // Simulate taking the last line of this 3-sided box
    // Need to identify which line is missing
    let missingMove = null;
    if (top === 0) missingMove = { type: 'h', r: startR, c: startC };
    else if (bottom === 0) missingMove = { type: 'h', r: startR + 1, c: startC };
    else if (left === 0) missingMove = { type: 'v', r: startR, c: startC };
    else if (right === 0) missingMove = { type: 'v', r: startR, c: startC + 1 };

    if (!missingMove) { // Should not happen for a 3-sided box, but good to guard
        return 1;
    }

    // Temporarily apply this move to see what new 3-sided boxes are formed
    const tempH = JSON.parse(JSON.stringify(hLinesState));
    const tempV = JSON.parse(JSON.stringify(vLinesState));
    // We don't need to copy bBoxesState here, as we are only checking for newly formed 3-sided boxes, not changing ownership
    
    if (missingMove.type === 'h') {
        tempH[missingMove.r][missingMove.c] = 1; // Mark as taken by the simulated player
    } else {
        tempV[missingMove.r][missingMove.c] = 1;
    }

    // Now check neighbors for newly formed 3-sided boxes
    const neighbors = [];
    if (missingMove.type === 'h') {
        // Potential boxes above and below the completed horizontal line
        neighbors.push({ r: missingMove.r - 1, c: missingMove.c }); 
        neighbors.push({ r: missingMove.r, c: missingMove.c });     
    } else { // type === 'v'
        // Potential boxes left and right of the completed vertical line
        neighbors.push({ r: missingMove.r, c: missingMove.c - 1 }); 
        neighbors.push({ r: missingMove.r, c: missingMove.c });     
    }

    for (const neighbor of neighbors) {
        const nr = neighbor.r;
        const nc = neighbor.c;
        if (nr >= 0 && nr < numRows - 1 && nc >= 0 && nc < numCols - 1 && bBoxesState[nr][nc] === 0) { // Only unowned
            const nTop = tempH[nr]?.[nc] || 0;
            const nBottom = tempH[nr + 1]?.[nc] || 0;
            const nLeft = tempV[nr]?.[nc] || 0;
            const nRight = tempV[nr]?.[nc + 1] || 0;
            const nDrawnSides = (nTop !== 0) + (nBottom !== 0) + (nLeft !== 0) + (nRight !== 0);

            if (nDrawnSides === 3 && !visitedBoxes.has(`${nr},${nc}`)) {
                chainLength += calculateChainLength(tempH, tempV, bBoxesState, nr, nc, visitedBoxes);
            }
        }
    }
    return chainLength;
}


/**
 * Analyzes available moves to find the most strategic sacrifice.
 * Prioritizes moves that create shorter chains for the opponent.
 * @param {Array<Object>} availableMoves - All currently available moves.
 * @returns {Object|null} A strategic sacrifice move, or null if no sacrificing moves exist.
 */
function findStrategicSacrifice(availableMoves) {
    let bestSacrifice = null;
    let minOpponentChainLength = Infinity;

    // Filter moves that create at least one 3-sided box (these are potential sacrifices)
    const sacrificingMoves = availableMoves.filter(move => {
        const simulation = simulateMove(move, horizontalLines, verticalLines, boxes, currentPlayerIndex + 1);
        return simulation.createsThreeSided;
    });

    if (sacrificingMoves.length === 0) {
        return null; // No sacrifice moves available
    }

    for (const move of sacrificingMoves) {
        // Simulate the AI's move
        const simulationAfterAIMove = simulateMove(move, horizontalLines, verticalLines, boxes, currentPlayerIndex + 1);
        const tempHAfterAI = simulationAfterAIMove.newHLines;
        const tempVAfterAI = simulationAfterAIMove.newVLines;

        let maxChainLengthForThisMove = 0; // Find the longest chain the opponent can get
        const visitedBoxesForMove = new Set();

        // Check all potential 3-sided boxes for the opponent after the AI's move
        for (let r = 0; r < numRows - 1; r++) {
            for (let c = 0; c < numCols - 1; c++) {
                if (boxes[r][c] === 0) { // Only unowned boxes
                    const top = tempHAfterAI[r]?.[c] || 0;
                    const bottom = tempHAfterAI[r + 1]?.[c] || 0;
                    const left = tempVAfterAI[r]?.[c] || 0;
                    const right = tempVAfterAI[r]?.[c + 1] || 0;
                    const drawnSides = (top !== 0) + (bottom !== 0) + (left !== 0) + (right !== 0);

                    if (drawnSides === 3 && !visitedBoxesForMove.has(`${r},${c}`)) {
                        const currentChainLength = calculateChainLength(tempHAfterAI, tempVAfterAI, boxes, r, c, visitedBoxesForMove);
                        if (currentChainLength > maxChainLengthForThisMove) {
                            maxChainLengthForThisMove = currentChainLength;
                        }
                    }
                }
            }
        }

        // The AI wants to minimize the maximum chain length it gives to the opponent
        if (maxChainLengthForThisMove < minOpponentChainLength) {
            minOpponentChainLength = maxChainLengthForThisMove;
            bestSacrifice = move;
        } else if (maxChainLengthForThisMove === minOpponentChainLength && Math.random() < 0.5) {
            // Introduce some randomness if multiple moves yield the same minimum chain length
            bestSacrifice = move;
        }
    }
    return bestSacrifice;
}


/**
 * Main AI move logic.
 */
async function makeAIMove() {
    const currentPlayer = players[currentPlayerIndex];
    if (!gameActive || currentPlayer.name !== 'Computer') return;

    let bestMove = null;
    const availableMoves = getAvailableMoves();

    if (availableMoves.length === 0) {
        console.warn("AI has no moves available.");
        return;
    }

    // --- Strategy 1: Immediate Box Completion (Winning Moves) ---
    // Look for moves that complete one or more boxes.
    const winningMoves = [];
    for (const move of availableMoves) {
        const simulation = simulateMove(move, horizontalLines, verticalLines, boxes, currentPlayerIndex + 1);
        if (simulation.score > 0) {
            winningMoves.push({ move, score: simulation.score });
        }
    }

    if (winningMoves.length > 0) {
        // Pick the winning move that completes the most boxes
        winningMoves.sort((a, b) => b.score - a.score);
        bestMove = winningMoves[0].move;
    }

    // --- Strategy 2: Safe Moves (Avoid Creating 3-Sided Boxes) ---
    // If no immediate winning moves, try to make a move that doesn't create any 3-sided boxes for the opponent.
    if (!bestMove) {
        const safeMoves = [];
        for (const move of availableMoves) {
            const simulation = simulateMove(move, horizontalLines, verticalLines, boxes, currentPlayerIndex + 1);
            if (!simulation.createsThreeSided) {
                safeMoves.push(move);
            }
        }

        if (safeMoves.length > 0) {
            // For legend AI, pick a safe move that preferably creates more 2-sided boxes
            // to potentially set up future chains for itself.
            // This is a simple heuristic; a deeper analysis would be more complex.
            // For now, let's keep it random among safe moves, or prioritize edges over center for less setup.
            bestMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }
    }

    // --- Strategy 3: Strategic Sacrifice (Chain Play) ---
    // If no winning moves and no perfectly safe moves, we are forced to create a 3-sided box.
    // Try to find a sacrifice that minimizes the chain length given to the opponent.
    if (!bestMove) {
        bestMove = findStrategicSacrifice(availableMoves);
    }
    
    // --- Strategy 4: Fallback to Random Move ---
    // This should ideally not be reached if the above strategies cover all scenarios.
    if (!bestMove && availableMoves.length > 0) {
        bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }


    if (bestMove) {
        // Small delay to make the AI move feel more natural
        await new Promise(resolve => setTimeout(resolve, 500));

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
        console.warn("AI could not find a move. This might indicate an issue or end of game.");
    }
}
