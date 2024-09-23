const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
    booking_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotel_id: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    check_in_date: {
        type: Date,
        required: true
    },
    check_out_date: {
        type: Date,
        required: true
    },
    number_of_guests: {
        type: Number,
        required: true
    },
    room_type: {
        type: String,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    booking_status: {
        type: String,
        enum: ['confirmed', 'pending', 'canceled'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending'
    }
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
