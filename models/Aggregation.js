const Hotel = require('./Hotel');
const Destination = require('./Destination');
const HotelBooking = require('./HotelBooking');

async function getTotalHotelsCount() {
    return await Hotel.countDocuments({});
}

async function getTotalDestinationsCount() {
    return await Destination.countDocuments({});
}

async function getTotalBookingsCount() {
    return await HotelBooking.countDocuments({});
}

async function getTotalPassengersCount() {
    const bookings = await HotelBooking.find({});
    return bookings.reduce((total, booking) => total + booking.number_of_guests, 0);
}

module.exports = {
    getTotalHotelsCount,
    getTotalDestinationsCount,
    getTotalBookingsCount,
    getTotalPassengersCount
};
