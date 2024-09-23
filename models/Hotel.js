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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const roomSchema = new Schema({
    roomType: {
        type: String,
        enum: ["Basic", "Deluxe", "Suite"],
        required: true
    },
    roomPrice: {
        type: Number,
        required: true
    },
    roomCapacity: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    totalRooms: {
        type: Number,
        required: true
    },
    description: {
        type: String
    }
});

const hotelSchema = new Schema({
    hotelID: {
        type: String,
        required: true,
        unique: true
    },
    hotelName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    images: [
        {
            type: String
        }
    ],
    description: {
        type: String
    },
    amenities: {
        type: [String]
    },
    contact: {
        phone: {
            type: String
        },
        email: {
            type: String
        },
        website: {
            type: String
        }
    },
    policies: {
        checkInTime: {
            type: String
        },
        checkOutTime: {
            type: String
        },
        cancellationPolicy: {
            type: String
        }
    },
    priceRange: [{
        type: Number,
        min: 0
    }, {
        type: Number,
        min: 0
    }],
    rooms: [roomSchema],
    reviews: [reviewSchema]
});

hotelSchema.methods.calculateRating = function () {
    const totalReviews = this.reviews.length;
    if (totalReviews === 0) {
        this.rating = 0;
    } else {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.rating = Math.round((totalRating / totalReviews) * 10) / 10;
    }
};

hotelSchema.pre('save', function (next) {
    if (this.isModified('reviews')) {
        this.totalReviews = this.reviews.length;
        this.calculateRating();
    }
    next();
});

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
