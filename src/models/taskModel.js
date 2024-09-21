const mongoose = require('mongoose');

// Define the Task schema
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        // required: [true, 'Task title is required'],  // Task title must be provided
        unique: true,  // Ensure that the task title is unique
        trim: true,  // Removes whitespace
        // minlength: [3, 'Task title must be at least 3 characters long']
    },
    description: {
        type: String,
        trim: true  // Removes whitespace
    },
    csvFile:{
        type:String,
    },
    dueDate: {
        type: Date,
        // required: [true, 'Due date is required'],  // Ensure due date is provided
        validate: {
            validator: function (v) {
                return v > Date.now();  // Due date cannot be in the past
            },
            message: 'Due date must be in the future'
        }
    },
    // low 1 medium 2 high 3
    priority: {
        type: String,
        enum: ['1', '2', '3'],  // Only allow these priority values
        default: '2'
    },
    // pending 1 inprogress 2 completed 3
    status: {
        type: String,
        enum: ['1', '2', '3'],  // Only allow these status values
        default: '1'
    },
    assignedUsers: [{
        // type: mongoose.Schema.Types.ObjectId,  // Reference to User model (if applicable)
        // ref: 'User'
        type:String,
    }],
    createdAt: {
        type: Date,
        default: Date.now  // Automatically set the creation date
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true  // Automatically add createdAt and updatedAt fields
});

// Middleware to ensure updatedAt is updated on document updates
taskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Export the Task model
const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
