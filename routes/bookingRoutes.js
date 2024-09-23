const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");
const HotelBooking = require("../models/HotelBooking");
const User = require('../models/User'); 
const mongoose = require('mongoose');

// Route for checking availability
router.post("/check-availability", async (req, res) => {
    try {
        const { hotelId, checkInDate, checkOutDate, roomType, rooms } = req.body;

        // Convert 'rooms' to a number
        const numRooms = parseInt(rooms);

        // Ensure 'rooms' is a valid number
        if (isNaN(numRooms) || numRooms <= 0) {
            return res.status(400).render("user/hotelDetails", {
                availabilityMessage: "Invalid number of rooms.",
                hotel: null,
                user: req.session.user
            });
        }

        // Find the hotel
        const hotel = await Hotel.findById(hotelId);

        if (!hotel) {
            return res.status(404).render("user/hotelDetails", {
                availabilityMessage: "Hotel not found.",
                hotel: null,
                user: req.session.user
            });
        }

        // Find the room type
        const room = hotel.rooms.find((room) => room.roomType === roomType);

        if (!room) {
            return res.status(400).render("user/hotelDetails", {
                availabilityMessage: `Room type ${roomType} not found in the hotel.`,
                hotel: null,
                user: req.session.user
            });
        }

        // Calculate available rooms
        const hotelBookings = await HotelBooking.find({
            hotel_id: hotelId,
            room_type: roomType,
            check_in_date: { $lt: new Date(checkOutDate) },
            check_out_date: { $gt: new Date(checkInDate) },
        });

        let availableRooms = room.totalRooms;
        hotelBookings.forEach((hotelBooking) => {
            availableRooms -= hotelBooking.number_of_guests;
        });

        // Check if available rooms are less than requested rooms
        if (availableRooms < numRooms) {
            return res.status(400).render("user/hotelDetails", {
                availabilityMessage: `Only ${availableRooms} rooms of ${roomType} type available for the selected dates.`,
                hotel: hotel,
                user: req.session.user
            });
        }

        // Rooms are available for the selected dates and room type
        return res.status(200).render("user/hotelDetails", {
            availabilityMessage: "Rooms are available for the selected dates and room type.",
            hotel: hotel,
            user: req.session.user
        });

    } catch (error) {
        console.error("Error checking availability:", error);
        return res.status(500).render("user/hotelDetails", {
            availabilityMessage: "Error checking availability, please try again later.",
            hotel: null,
            user: req.session.user
        });
    }
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/auth/login");
    }
};

// Function to generate a unique HotelBooking ID
function generateHotelBookingId() {
    const idLength = 8;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let hotelBookingId = "";
    for (let i = 0; i < idLength; i++) {
        hotelBookingId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return hotelBookingId;
}

router.get('/hotel/:id', isLoggedIn, async (req, res) => {
    try {
        // Fetch the hotel details using hotel_id
        const hotel = await Hotel.findById(req.params.id);

        // Render the HotelBooking form with hotel details
        res.render('user/Booking', { hotel: hotel });
    } catch (error) {
        console.error('Error fetching hotel:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/hotel/:id/confirm',isLoggedIn, async (req, res) => {
    try {
        const { hotel_id, check_in_date, check_out_date, number_of_guests, room_type } = req.body;

        // Find the hotel
        const hotel = await Hotel.findById(hotel_id);

        if (!hotel) {
            return res.status(404).send(`<script>alert("Hotel not found."); window.location.href = "/";</script>`);
        }

        // Find the room type
        const room = hotel.rooms.find((room) => room.roomType === room_type);

        if (!room) {
            return res.status(400).send(`<script>alert("Room type ${room_type} not found in the hotel."); window.location.href = "/";</script>`);
        }

        // Calculate number of days
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        const numberOfDays = Math.round(Math.abs((checkOut - checkIn) / oneDay));

        // Calculate total price
        const totalPrice = numberOfDays * room.roomPrice * number_of_guests;

        // Calculate available rooms
        const bookedRooms = await HotelBooking.aggregate([
            {
                $match: {
                    hotel_id: hotel_id,
                    room_type: room_type,
                    check_in_date: { $lt: checkOut },
                    check_out_date: { $gt: checkIn }
                }
            },
            {
                $group: {
                    _id: null,
                    total_guests: { $sum: "$number_of_guests" }
                }
            }
        ]);

        const totalBookedGuests = bookedRooms.length > 0 ? bookedRooms[0].total_guests : 0;
        const availableRooms = room.totalRooms - totalBookedGuests;

        // Check if available rooms are less than requested rooms
        if (availableRooms < number_of_guests) {
            return res.status(400).send(`<script>alert("Only ${availableRooms} rooms of ${room_type} type available for the selected dates."); window.location.href = "/hotels";</script>`);
        }

        // Generate a unique booking ID
        const booking_id = generateHotelBookingId();

        // Create a new HotelBooking
        const newHotelBooking = new HotelBooking({
            booking_id: booking_id,
            hotel_id: hotel_id,
            user_id: req.session.user._id, // Assuming you have user session
            check_in_date: checkIn,
            check_out_date: checkOut,
            number_of_guests: parseInt(number_of_guests),
            room_type: room_type,
            total_price: totalPrice,
            booking_status: 'pending',
            payment_status: 'pending'
        });

        // Save the HotelBooking to the database
        await newHotelBooking.save();

        // Redirect to the payment page with the new booking ID
        res.send(`<script>alert("Booking on the way!"); window.location.href = "/booking/payment/${newHotelBooking._id}?user=${encodeURIComponent(JSON.stringify(req.session.user))}";</script>`);
    } catch (error) {
        console.error('Error confirming HotelBooking:', error);
        res.status(500).send(`<script>alert("Internal Server Error. Please try again later."); window.location.href = "/";</script>`);
    }
});


router.get('/payment/:id',isLoggedIn, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await HotelBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).send(`<script>alert("Booking not found."); window.location.href = "/?user=${encodeURIComponent(JSON.stringify(req.session.user))}";</script>`);
        }
        res.render('user/payment', { booking: booking });
    } catch (error) {
        console.error('Error fetching booking for payment:', error);
        res.status(500).send(`<script>alert("Internal Server Error. Please try again later."); window.location.href = "/";</script>`);
    }
});

router.post('/payment/process',isLoggedIn, async (req, res) => {
    try {
        const { booking_id, card_number, card_expiry, card_cvv } = req.body;

        // Simulate payment processing (you should replace this with your actual payment processing logic)
        // Here we're just checking if the card number is not empty
        if (!card_number.trim()) {
            return res.status(400).send(`<script>alert("Invalid card information."); window.location.href = "/";</script>`);
        }

        // Find the booking
        const booking = await HotelBooking.findById(booking_id);
        if (!booking) {
            return res.status(404).send(`<script>alert("Booking not found."); window.location.href = "/";</script>`);
        }

        // Update booking status and payment status
        booking.booking_status = 'confirmed';
        booking.payment_status = 'paid';

        // Save the updated booking
        await booking.save();

        // Redirect to confirmation page with success message
        res.send(`<script>alert("Payment successful!"); window.location.href = "/thankyou?user=${encodeURIComponent(JSON.stringify(req.session.user))}";</script>`);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send(`<script>alert("Internal Server Error. Please try again later."); window.location.href = "/";</script>`);
    }
});

router.get('/user-bookings', isLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user._id; // Assuming you have user session
        console.log(userId);
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send("Invalid user ID");
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const hotelBookings = await HotelBooking.find({ user_id: userId });

        // Pass hotelBookings as bookings to the EJS template
        res.render('user/user-bookings', { user: user, bookings: hotelBookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


module.exports = router;
