const express = require('express');
const taskController = require('../../controllers/taskcontroller');
const validateCSV = require('../middlewares/validateCSV');

const router = express.Router();

// Route to export tasks to CSV
router.get('/export', taskController.exportTasksToCSV);

// Route to import tasks from CSV
router.post('/import', validateCSV, taskController.importTasksFromCSV);

module.exports = router;
