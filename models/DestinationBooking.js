const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PackageSchema = new Schema({
    name: {
        type: String,
        required: true,
        enum: ["Basic", "Standard", "Premium"],
    },
    price: {
        type: Number,
        required: true,
        default: function () {
            if (this.name === "Basic") return 100;
            if (this.name === "Standard") return 200;
            if (this.name === "Premium") return 300;
        },
    },
    duration_days: {
        type: Number,
        required: true,
        default: function () {
            if (this.name === "Basic") return 3;
            if (this.name === "Standard") return 5;
            if (this.name === "Premium") return 7;
        },
    },
    description: {
        type: String,
        required: true,
        default: function () {
            if (this.name === "Basic")
                return "A basic package for a short getaway.";
            if (this.name === "Standard")
                return "A standard package with additional city tour.";
            if (this.name === "Premium")
                return "A premium package with city tour and adventure activities.";
        },
    },
    inclusions: {
        type: [String],
        required: true,
        default: function () {
            if (this.name === "Basic") return ["Accommodation", "Breakfast"];
            if (this.name === "Standard")
                return ["Accommodation", "Breakfast", "City Tour"];
            if (this.name === "Premium")
                return ["Accommodation", "Breakfast", "City Tour", "Adventure Activities"];
        },
    },
    accommodations: {
        type: String,
        required: true,
        default: function () {
            if (this.name === "Basic") return "Standard accommodations";
            if (this.name === "Standard") return "Standard accommodations";
            if (this.name === "Premium") return "Luxury accommodations";
        },
    },
});


const DestinationBookingSchema = new Schema({
    booking_id: {
        type: String,
        required: true,
        unique: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    destination_id: {
        type: Schema.Types.ObjectId,
        ref: "Destination",
        required: true,
    },
    travel_date: {
        type: Date,
        required: true,
    },
    number_of_travelers: {
        type: Number,
        required: true,
    },
    packages: [PackageSchema], 
    total_price: {
        type: Number,
        required: true,
    },
    booking_status: {
        type: String,
        enum: ["confirmed", "pending", "cancelled"],
        default: "pending",
    },
    payment_status: {
        type: String,
        enum: ["paid", "pending", "failed"],
        default: "pending",
    },
});

const DestinationBooking = mongoose.model(
    "DestinationBooking",
    DestinationBookingSchema
);
module.exports = DestinationBooking;
