const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    inquiry: {
        type: String,
        enum: ['General Inquiry', 'Sales', 'Support', 'Feedback', 'Other'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model is already defined to prevent OverwriteModelError
const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

module.exports = Submission;
