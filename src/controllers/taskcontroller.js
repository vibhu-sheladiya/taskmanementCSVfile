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
exports.importTasksFromCSV = (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const filePath = req.file.path; // Get the path from the file object

    if (!filePath) {
        console.error('File path is undefined');
        return res.status(400).json({ status: 'error', message: 'File path is undefined' });
    }

    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Process and save tasks to database
                for (const taskData of results) {
                    await Task.create(taskData);
                }
                res.status(201).json({ status: 'success', message: 'Tasks imported successfully' });
            } catch (error) {
                console.error('Error importing tasks:', error);
                res.status(500).json({ status: 'error', message: 'Error importing tasks', error });
            }
        });
};



// Filter and sort tasks
// exports.getFilteredTasks = async (req, res, next) => {
//     const { status, priority, dueDate, assignee } = req.query;

//     const filterCriteria = {};
//     if (status) filterCriteria.status = status;
//     if (priority) filterCriteria.priority = priority;
//     if (dueDate) filterCriteria.dueDate = { $gte: new Date(dueDate) };
//     if (assignee) filterCriteria.assignee = assignee;

//     try {
//         const tasks = await Task.find(filterCriteria).sort({ dueDate: 1, priority: -1 });
//         res.status(200).json(tasks);
//     } catch (error) {
//         next(error);
//     }
// };


// const Task = require('../models/taskModel');

// Complex Filtering and Sorting
exports.getFilteredTasks = async (req, res, next) => {
    try {
        const { status, priority, assignee, dueDate, sortBy, order = 'asc' } = req.query;

        // Build query object for filtering
        let filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignee) filter.assignee = assignee;
        if (dueDate) {
            const date = new Date(dueDate);
            filter.dueDate = {
                $gte: new Date(date.setHours(0, 0, 0, 0)),  // Start of the day
                $lt: new Date(date.setHours(23, 59, 59, 999)),  // End of the day
            };
        }

        // Build sorting object
        let sort = {};
        if (sortBy) {
            sort[sortBy] = order === 'asc' ? 1 : -1;
        }

        // Execute the query with filtering and sorting
        const tasks = await Task.find(filter).sort(sort);

        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaginatedTasks = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const tasks = await Task.find().skip(skip).limit(limit);
        const total = await Task.countDocuments();
        res.status(200).json({
            totalTasks: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            tasks,
        });
    } catch (error) {
        next(error);
    }
};

