const express = require('express');
const taskController = require('../../controllers/taskcontroller');
// const taskController = require('../../controllers/getFilteredTasks');

const validateCSV = require('../../middlewares/validateCSV');

const router = express.Router();

// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Ensure this directory exists or create it
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
// });


// Route to export tasks to CSV
router.get('/export', taskController.exportTasksToCSV);

// Route to import tasks from CSV
router.post('/import', validateCSV, taskController.importTasksFromCSV);
// router.post('/import', upload.single('csvFile'), validateCSV, taskController.importTasksFromCSV);

router.get('/filter', taskController.getFilteredTasks);
router.get('/export', taskController.getPaginatedTasks);

// router.


module.exports = router;
