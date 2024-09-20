const { Parser } = require('json2csv');
const csvParser = require('csv-parser');
const fs = require('fs');

// Generate CSV from data
exports.generateCSV = (tasks) => {
    const fields = ['title', 'description', 'dueDate', 'priority', 'status', 'assignee'];
    const parser = new Parser({ fields });
    return parser.parse(tasks);
};

// Parse CSV file data
exports.parseCSV = (csvData) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(csvData)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

// Task validation logic
exports.validateTaskData = (task) => {
    if (!task.title || task.title.trim() === '') return 'Title is required';
    if (new Date(task.dueDate) < new Date()) return 'Due date cannot be in the past';
    if (!['low', 'medium', 'high'].includes(task.priority)) return 'Invalid priority';
    return null;
};
