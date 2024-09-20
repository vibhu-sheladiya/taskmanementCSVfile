const multer = require('multer');

// Limit file size and ensure it's a CSV
const csvFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
        cb(null, true);
    } else {
        cb(new Error('File format not supported. Please upload a CSV file.'), false);
    }
};

const upload = multer({
    fileFilter: csvFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
});

module.exports = upload.single('csvFile');
