const multer = require('multer');
const path = require('path');

// File storage
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/bids');
    },

    filename: function (req, file, callback) {
        const fileName =
            Date.now() + '-' + file.originalname;

        callback(null, fileName);
    }
});

// File validation
const fileFilter = function (req, file, callback) {
    const allowedTypes = /pdf|doc|docx/;

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const validExtension = allowedTypes.test(extension);

    if (!validExtension) {
        return callback(
            new Error('Only PDF, DOC and DOCX files are allowed')
        );
    }

    callback(null, true);
};

const bidUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = bidUpload;