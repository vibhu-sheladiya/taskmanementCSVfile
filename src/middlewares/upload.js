// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage with dynamic paths and file name formatting
const singleFileUpload = (basePath, name) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // Set the dynamic path for storing files
            const dynamicPath = path.join(__dirname, '../public' + basePath);

            // Check if the path exists, if not, create it recursively
            if (!fs.existsSync(dynamicPath)) {
                fs.mkdirSync(dynamicPath, { recursive: true });
            }

            cb(null, dynamicPath); // Save file to the dynamic path
        },
        filename: (req, file, cb) => {
            // Use timestamp and clean up the original file name (replace spaces, lowercase)
            cb(
                null,
                Date.now() + '-' + file.originalname.replace(/\s/g, '-').toLowerCase()
            );
        }
    });

    // Create and return multer upload function
    return multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            // Allow only CSV files
            if (file.mimetype !== 'text/csv') {
                return cb(new Error('Please upload a CSV file.'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 2 * 1024 * 1024 } // Limit file size to 2MB
    }).single(name); // Use the provided file name field for upload
};

module.exports = singleFileUpload;
