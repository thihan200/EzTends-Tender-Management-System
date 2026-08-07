const multer = require('multer');
const path = require('path');

// Set file storage location
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents');
    },

    filename: (req, file, cb) => {
        // Create unique file name
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// Check allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extName) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed'));
    }
};

// Upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;