const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const destinationSchema = new Schema({
    destID: {
        type: String,
        required: true,
        unique: true
    },
    destinationName: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    activities: {
        type: [String]
    },
    bestFor: [{
        type: String
    }],
    transportOptions: {
        type: [String]
    },
    description: {
        type: String
    },
    images: [{
        type: String,
        required: true
    }],
    languages: {
        type: [String]
    },
    cuisine: {
        type: [String]
    },
    bestTime: {
        type: [String]
    },
    reviews: [reviewSchema],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
});

destinationSchema.methods.calculateRating = function() {
    const totalReviews = this.reviews.length;
    if (totalReviews === 0) {
        this.rating = 0;
    } else {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.rating = Math.round((totalRating / totalReviews) * 10) / 10;
    }
};

destinationSchema.pre('save', function(next) {
    if (this.isModified('reviews')) {
        this.totalReviews = this.reviews.length;
        this.calculateRating();
    }
    next();
});

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
