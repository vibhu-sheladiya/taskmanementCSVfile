const Task = require('../models/taskModel');
const { parseCSV, generateCSV, validateTaskData } = require('../utills/csvUtils');
const fs = require('fs');

// Export tasks to CSV
exports.exportTasksToCSV = async (req, res, next) => {
    try {
        const tasks = await Task.find({});
        const csv = generateCSV(tasks);
        res.header('Content-Type', 'text/csv');
        res.attachment('tasks.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

// Import tasks from CSV
exports.importTasksFromCSV = async (req, res, next) => {
    try {
        const file = req.file; // Assume file is uploaded using multer
        const csvData = fs.readFileSync(file.path, 'utf-8');
        const tasks = parseCSV(csvData);

        let failedImports = [];
        let successImports = [];

        for (let task of tasks) {
            const validationError = validateTaskData(task);
            if (validationError) {
                failedImports.push({ task, error: validationError });
                continue;
            }
            const newTask = new Task(task);
            await newTask.save();
            successImports.push(newTask);
        }

        if (failedImports.length) {
            // Create CSV error report
            const errorCSV = generateCSV(failedImports);
            res.attachment('import-errors.csv').send(errorCSV);
        } else {
            res.status(201).json({ success: true, tasks: successImports });
        }
    } catch (error) {
        next(error);
    }
};
