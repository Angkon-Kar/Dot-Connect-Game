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
    // Clear previous buttons
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

