const Task = require('../models/taskModel');
const { parseCSV, generateCSV, validateTaskData } = require('../utills/csvUtils');
// const fs = require('fs');


// controllers/taskController.js
// const Task = require('../models/taskModel');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const { validateTask } = require('../utills/validation');
// Export tasks to CSV
exports.exportTasks = async (req, res) => {
    try {
      const tasks = await Task.find();
  
      const csvWriter = createCsvWriter({
        path: path.join(__dirname, '../uploads/tasks_export.csv'),
        header: [
          { id: 'title', title: 'Title' },
          { id: 'description', title: 'Description' },
          { id: 'dueDate', title: 'Due Date' },
          { id: 'priority', title: 'Priority' },
          { id: 'status', title: 'Status' },
          { id: 'assignedUsers', title: 'Assigned Users' },
        ],
      });
  
      const records = tasks.map(task => ({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        priority: task.priority,
        status: task.status,
        assignedUsers: task.assignedUsers.join('; '),
      }));
  
      await csvWriter.writeRecords(records);
  
      const filePath = path.join(__dirname, '../uploads/csvFile-tm');
      res.download(filePath, 'tasks.csv', (err) => {
        if (err) {
          console.error('Error downloading the file:', err);
          return res.status(500).json({ message: 'Error downloading the file.' });
        }
  
        // Optionally delete the file after download
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting the file:', unlinkErr);
          }
        });
      });
    } catch (error) {
      console.error('Error exporting tasks:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  
  const upload = multer({
      dest: path.join(__dirname, '../uploads'),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed!'), false);
        }
      },
    }).single('file');
    
    exports.importTasks = (req, res) => {
      upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          // Multer-specific errors
          return res.status(400).json({ message: err.message });
        } else if (err) {
          // Other errors
          return res.status(400).json({ message: err.message });
        }
    
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded.' });
        }
    
        const results = [];
        const errors = [];
        const filePath = req.file.path;
    
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            // Remove the uploaded file after processing
            fs.unlinkSync(filePath);
    
            const bulkOps = [];
            for (let i = 0; i < results.length; i++) {
              const row = results[i];
              const { error, value } = validateTask(row);
    
              if (error) {
                errors.push({ row: i + 1, message: error.details[0].message });
                continue;
              }
    
              // Check for duplicate task titles
              const duplicate = await Task.findOne({ title: value.title });
              if (duplicate) {
                errors.push({ row: i + 1, message: 'Duplicate task title.' });
                continue;
              }
    
              // Check if dueDate is not in the past
              const dueDate = new Date(value.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (dueDate < today) {
                errors.push({ row: i + 1, message: 'Due date cannot be in the past.' });
                continue;
              }
    
              // Prepare bulk operation
              bulkOps.push({
                insertOne: {
                  document: value,
                },
              });
            }
    
            if (bulkOps.length > 0) {
              try {
                await Task.bulkWrite(bulkOps);
              } catch (bulkError) {
                console.error('Bulk write error:', bulkError);
                return res.status(500).json({ message: 'Error importing tasks.' });
              }
            }
    
            if (errors.length > 0) {
              // Generate error report CSV
              const errorCsvPath = path.join(__dirname, '../uploads/error_report.csv');
              const errorCsvWriter = createCsvWriter({
                path: errorCsvPath,
                header: [
                  { id: 'row', title: 'Row' },
                  { id: 'message', title: 'Error Message' },
                ],
              });
    
              await errorCsvWriter.writeRecords(errors);
    
              return res.download(errorCsvPath, 'error_report.csv', (downloadErr) => {
                if (downloadErr) {
                  console.error('Error downloading error report:', downloadErr);
                  return res.status(500).json({ message: 'Error downloading error report.' });
                }
    
                // Optionally, delete the error report after download
                // fs.unlinkSync(errorCsvPath);
              });
            }
    
            res.status(200).json({ message: 'All tasks imported successfully.' });
          })
          .on('error', (parseError) => {
            console.error('Error parsing CSV:', parseError);
            res.status(500).json({ message: 'Error parsing CSV file.' });
          });
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

