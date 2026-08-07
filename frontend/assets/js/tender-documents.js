// Authority Tender Documents page

const documentTableBody =
    document.getElementById(
        'documentTableBody'
    );

const resultCount =
    document.getElementById(
        'resultCount'
    );

const tenderTitle =
    document.getElementById(
        'tenderTitle'
    );

const params =
    new URLSearchParams(
        window.location.search
    );

const tenderId =
    params.get('tender_id');


// Protect HTML text
function escapeDocumentText(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// Get filename
function getFileName(filePath) {
    if (!filePath) {
        return 'Document';
    }

    const cleanPath =
        String(filePath)
            .replaceAll('\\', '/');

    return cleanPath
        .split('/')
        .pop();
}


// Get document URL
function getDocumentUrl(filePath) {
    if (!filePath) {
        return '#';
    }

    const cleanPath =
        String(filePath)
            .replaceAll('\\', '/')
            .replace(/^\/+/, '');

    return `/${cleanPath}`;
}


// Format date
function formatDate(value) {
    if (!value) {
        return 'Not available';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );
}


// Check Authority access
function checkAuthorityAccess() {
    if (!checkAuth()) {
        return false;
    }

    startAutoLogout();

    const user =
        getUser();

    if (
        !user ||
        user.type !==
            'TENDERING_AUTHORITY'
    ) {
        showPopup(
            'Access Denied',
            'Only Tendering Authorities can view these documents.',
            'warning',
            'login.html'
        );

        return false;
    }

    return true;
}


// Display documents
function displayDocuments(documents) {

    resultCount.textContent =
        `${documents.length} approved document${
            documents.length === 1
                ? ''
                : 's'
        } found`;

    if (documents.length === 0) {

        documentTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <h3 class="h5">
                        No Approved Documents
                    </h3>

                    <p class="mb-0">
                        No Supplier documents have been
                        approved for this tender yet.
                    </p>
                </td>
            </tr>
        `;

        return;
    }

    documentTableBody.innerHTML =
        documents.map(function (item) {

            const fileName =
                getFileName(
                    item.file_path
                );

            const fileUrl =
                getDocumentUrl(
                    item.file_path
                );

            const supplier =
                item.company_name ||
                item.uploaded_by_name ||
                'Supplier';

            return `
                <tr>

                    <td>
                        <div class="document-name">
                            ${escapeDocumentText(
                                fileName
                            )}
                        </div>
                    </td>

                    <td>
                        <div>
                            ${escapeDocumentText(
                                supplier
                            )}
                        </div>

                        <div class="supplier-info">
                            ${escapeDocumentText(
                                item.uploaded_by_email ||
                                ''
                            )}
                        </div>
                    </td>

                    <td>
                        ${escapeDocumentText(
                            formatDate(
                                item.uploaded_at
                            )
                        )}
                    </td>

                    <td>
                        <span
                            class="status-badge
                            status-approved"
                        >
                            APPROVED
                        </span>
                    </td>

                    <td>
                        <a
                            href="${escapeDocumentText(
                                fileUrl
                            )}"
                            class="btn btn-sm
                            btn-outline-eztends"
                            target="_blank"
                        >
                            View Document
                        </a>
                    </td>

                </tr>
            `;
        }).join('');
}


// Load documents
async function loadDocuments() {

    try {

        const response =
            await fetch(
                `/api/documents/tender/${tenderId}/approved`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Unable to load documents'
            );
        }

        const documents =
            data.documents || [];

        if (
            documents.length > 0 &&
            documents[0].tender_title
        ) {
            tenderTitle.textContent =
                documents[0].tender_title;
        }

        displayDocuments(
            documents
        );

    } catch (error) {

        console.log(error);

        resultCount.textContent =
            'Unable to load documents';

        documentTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    ${escapeDocumentText(
                        error.message
                    )}
                </td>
            </tr>
        `;
    }
}


// Start page
if (checkAuthorityAccess()) {

    if (!tenderId) {

        showPopup(
            'Tender Not Selected',
            'Please select a tender first.',
            'warning',
            'my-tenders.html'
        );

    } else {

        loadDocuments();
    }
}