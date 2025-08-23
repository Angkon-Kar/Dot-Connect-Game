function showCustomAlert(message, onConfirm = null, isConfirm = false) {
    document.getElementById('customAlertMessage').textContent = message;
    const confirmButton = document.createElement('button');
    confirmButton.className = 'button-primary';
    confirmButton.textContent = 'OK';
    confirmButton.onclick = () => {
        document.getElementById('customAlertModal').classList.add('hidden');
        if (onConfirm) onConfirm();
    };

    const modalContent = document.getElementById('customAlertModal').querySelector('.bg-white');
    modalContent.querySelectorAll('.button-primary').forEach(btn => btn.remove());
    modalContent.appendChild(confirmButton);

    if (isConfirm) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'button-primary bg-gray-500 hover:bg-gray-600 ml-4';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => document.getElementById('customAlertModal').classList.add('hidden');
        modalContent.appendChild(cancelButton);
    }
    document.getElementById('customAlertModal').classList.remove('hidden');
}
window.showCustomAlert = showCustomAlert;

function handleCanvasClick(event) {
    if (!gameActive) return;

    // Determine if it's the current user's turn in online mode
    if (gameMode === 'online') {
        const currentPlayerId = players[currentPlayerIndex].id;
        if (getUserId() !== currentPlayerId) {
            showCustomAlert("It's not your turn!");
            return;
        }
    }
    // Prevent moves if it's AI's turn
    if (gameMode === 'ai' && players[currentPlayerIndex].name === 'Computer') {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    let lineDrawn = false;
    let lineType = null;
    let lineRow, lineCol;
    const currentPlayerNumber = currentPlayerIndex + 1; // 1-based player number

    // Check for horizontal lines
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols - 1; c++) {
            const lineX1 = padding + c * cellSize;
            const lineY = padding + r * cellSize;
            const lineX2 = padding + (c + 1) * cellSize;

            if (mouseX > lineX1 + dotRadius && mouseX < lineX2 - dotRadius &&
                Math.abs(mouseY - lineY) < cellSize / 4) {
                if (horizontalLines[r][c] === 0) {
                    horizontalLines[r][c] = currentPlayerNumber;
                    lineDrawn = true;
                    lineType = 'h';
                    lineRow = r;
                    lineCol = c;
                    break;
                }
            }
        }
        if (lineDrawn) break;
    }


    // Check for vertical lines
    if (!lineDrawn) {
        for (let r = 0; r < numRows - 1; r++) {
            for (let c = 0; c < numCols; c++) {
                const lineX = padding + c * cellSize;
                const lineY1 = padding + r * cellSize;
                const lineY2 = padding + (r + 1) * cellSize;

                if (mouseY > lineY1 + dotRadius && mouseY < lineY2 - dotRadius &&
                    Math.abs(mouseX - lineX) < cellSize / 4) {
                    if (verticalLines[r][c] === 0) {
                        verticalLines[r][c] = currentPlayerNumber;
                        lineDrawn = true;
                        lineType = 'v';
                        lineRow = r;
                        lineCol = c;
                        break;
                    }
                }
            }
        }
    }

    if (lineDrawn) {
        const boxesFormed = checkForBoxes();
        if (gameMode === 'online') {
            updateOnlineGameState(lineType, lineRow, lineCol, boxesFormed > 0);
        } else {
            if (boxesFormed === 0) {
                switchPlayer();
            }
            updateScoreDisplays();
            updatePlayerTurnDisplay();
            drawGame();
            checkGameOver();
        }
    }
}