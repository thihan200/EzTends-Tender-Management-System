// Show reusable Bootstrap popup
function showPopup(title, message, type = 'success', redirectPage = '') {
    // Remove previous popup
    const oldPopup = document.getElementById('appPopup');

    if (oldPopup) {
        oldPopup.remove();
    }

    let headerColor = 'bg-success';

    if (type === 'danger') {
        headerColor = 'bg-danger';
    } else if (type === 'warning') {
        headerColor = 'bg-warning';
    } else if (type === 'info') {
        headerColor = 'bg-info';
    }

    // Create popup
    const popupHtml = `
        <div class="modal fade" id="appPopup" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">

                    <div class="modal-header ${headerColor} text-white">
                        <h5 class="modal-title" id="popupTitle"></h5>

                        <button
                            type="button"
                            class="btn-close btn-close-white"
                            data-bs-dismiss="modal">
                        </button>
                    </div>

                    <div class="modal-body">
                        <p id="popupMessage" class="mb-0"></p>
                    </div>

                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-eztends"
                            data-bs-dismiss="modal">
                            OK
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);

    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupMessage').textContent = message;

    const popupElement = document.getElementById('appPopup');
    const popup = new bootstrap.Modal(popupElement);

    // Redirect after closing popup
    popupElement.addEventListener('hidden.bs.modal', function () {
        popupElement.remove();

        if (redirectPage) {
            window.location.href = redirectPage;
        }
    });

    popup.show();
}