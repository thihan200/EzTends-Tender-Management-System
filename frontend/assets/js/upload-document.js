// Upload Document page

const uploadForm = document.getElementById('uploadForm');
const tenderSelect = document.getElementById('tenderSelect');
const documentFileInput = document.getElementById('documentFile');
const fileDropArea = document.getElementById('fileDropArea');

const selectedFileBox = document.getElementById('selectedFileBox');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const removeFileButton = document.getElementById('removeFileButton');

const uploadButton = document.getElementById('uploadButton');
const uploadProgress = document.getElementById('uploadProgress');

const allowedExtensions = [
    'pdf',
    'doc',
    'docx',
    'jpg',
    'jpeg',
    'png'
];

const maximumFileSize = 5 * 1024 * 1024;

// Read array from common response formats
function getTenderArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.tenders)) {
        return data.tenders;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

// Check Supplier access
function checkSupplierAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user = getUser();

    if (!user || user.type !== 'SUPPLIER') {
        showPopup(
            'Access Denied',
            'Only Suppliers can upload documents.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}

// Show field error
function showTenderError(message) {
    tenderSelect.classList.add('is-invalid');
    tenderSelect.classList.remove('is-valid');
    document.getElementById('tenderError').textContent = message;
}

// Show valid tender field
function showTenderValid() {
    tenderSelect.classList.remove('is-invalid');
    tenderSelect.classList.add('is-valid');
    document.getElementById('tenderError').textContent = '';
}

// Show file error
function showFileError(message) {
    document.getElementById('fileError').textContent = message;
}

// Clear file error
function clearFileError() {
    document.getElementById('fileError').textContent = '';
}

// Format file size
function formatFileSize(size) {
    if (size < 1024) {
        return `${size} bytes`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

// Get file extension
function getFileExtension(fileName) {
    const parts = fileName.toLowerCase().split('.');

    if (parts.length < 2) {
        return '';
    }

    return parts.pop();
}

// Validate selected tender
function validateTender() {
    if (!tenderSelect.value) {
        showTenderError('Please select a tender.');
        return false;
    }

    showTenderValid();
    return true;
}

// Validate selected file
function validateFile() {
    const file = documentFileInput.files[0];

    if (!file) {
        showFileError('Please select a document.');
        return false;
    }

    const extension = getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
        showFileError(
            'Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed.'
        );

        return false;
    }

    if (file.size > maximumFileSize) {
        showFileError('File size must be 5 MB or smaller.');
        return false;
    }

    clearFileError();
    return true;
}

// Display selected file details
function showSelectedFile() {
    const file = documentFileInput.files[0];

    if (!file) {
        selectedFileBox.classList.remove('show');
        return;
    }

    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatFileSize(file.size);
    selectedFileBox.classList.add('show');
}

// Remove selected file
function removeSelectedFile() {
    documentFileInput.value = '';
    selectedFileBox.classList.remove('show');
    selectedFileName.textContent = '';
    selectedFileSize.textContent = '';
    clearFileError();
}

// Add open tenders to dropdown
function displayTenderOptions(tenders) {
    const openTenders = tenders.filter(function (tender) {
        return tender.status === 'OPEN';
    });

    tenderSelect.innerHTML = `
        <option value="">Select a tender</option>
    `;

    openTenders.forEach(function (tender) {
        const option = document.createElement('option');

        option.value = tender.tender_id;
        option.textContent =
            `#${tender.tender_id} - ${tender.title}`;

        tenderSelect.appendChild(option);
    });

    if (openTenders.length === 0) {
        tenderSelect.innerHTML = `
            <option value="">No open tenders available</option>
        `;

        tenderSelect.disabled = true;
        uploadButton.disabled = true;
    }
}

// Load tender list
async function loadTenders() {
    try {
        const response = await fetch('/api/tenders');

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to load tenders'
            );
        }

        const tenders = getTenderArray(data);
        displayTenderOptions(tenders);

    } catch (error) {
        tenderSelect.innerHTML = `
            <option value="">Unable to load tenders</option>
        `;

        tenderSelect.disabled = true;
        uploadButton.disabled = true;

        showPopup(
            'Tender Loading Failed',
            'Could not load the tender list.',
            'danger'
        );
    }
}

// Handle normal file selection
documentFileInput.addEventListener('change', function () {
    showSelectedFile();
    validateFile();
});

// Drag over file area
fileDropArea.addEventListener('dragover', function (event) {
    event.preventDefault();
    fileDropArea.classList.add('dragging');
});

// Remove drag style
fileDropArea.addEventListener('dragleave', function () {
    fileDropArea.classList.remove('dragging');
});

// Handle dropped file
fileDropArea.addEventListener('drop', function (event) {
    event.preventDefault();
    fileDropArea.classList.remove('dragging');

    const droppedFiles = event.dataTransfer.files;

    if (droppedFiles.length > 0) {
        documentFileInput.files = droppedFiles;
        showSelectedFile();
        validateFile();
    }
});

removeFileButton.addEventListener(
    'click',
    removeSelectedFile
);

tenderSelect.addEventListener(
    'change',
    validateTender
);

// Submit upload form
uploadForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const tenderValid = validateTender();
    const fileValid = validateFile();

    if (!tenderValid || !fileValid) {
        return;
    }

    const formData = new FormData();

    formData.append(
        'tender_id',
        tenderSelect.value
    );

    formData.append(
        'document',
        documentFileInput.files[0]
    );

    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';
    uploadProgress.classList.add('show');

    try {
        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getToken()}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                'Upload Failed',
                data.message || 'Unable to upload document.',
                'danger'
            );

            return;
        }

        uploadForm.reset();
        removeSelectedFile();
        tenderSelect.classList.remove('is-valid');

        showPopup(
            'Document Uploaded',
            'Your document was uploaded successfully and is pending validation.',
            'success',
            'supplier-dashboard.html'
        );

    } catch (error) {
        showPopup(
            'Server Connection Error',
            'Cannot connect to the local server.',
            'danger'
        );
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Document';
        uploadProgress.classList.remove('show');
    }
});

// Start page
if (checkSupplierAccess()) {
    loadTenders();
}
