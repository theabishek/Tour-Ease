const express = require("express");
const router = express.Router();
const Destination = require("../models/Destination");
const DestinationBooking = require("../models/DestinationBooking");
const User = require('../models/User'); 
const mongoose = require('mongoose');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/auth/login");
    }
};
async function fetchUser(req, res, next) {
    if (req.session.user_id) {
        try {
            const user = await User.findById(req.session.user_id);
            res.locals.currentUser = user;
        } catch (error) {
            console.error("Error fetching user:", error);
            res.locals.currentUser = null; // Set to null if error
        }
    } else {
        res.locals.currentUser = null; // Set to null if no user_id
    }
    next(); 
}

// Function to generate a unique DestinationBooking ID
function generateDestinationBookingId() {
    const idLength = 8;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let destinationBookingId = "";
    for (let i = 0; i < idLength; i++) {
        destinationBookingId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return destinationBookingId;
}

router.get('/destination/:id', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id).populate('packages');
        if (!destination) {
            return res.status(404).send('Destination not found');
        }
        res.render('user/destinationBooking', { destination: destination });
    } catch (error) {
        console.error('Error fetching destination:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/destination/:id/confirm',isLoggedIn, async (req, res) => {
    try {
        const { destination_id, travel_date, number_of_travelers, package } = req.body;

        // Find the destination
        const destination = await Destination.findById(destination_id);

        if (!destination) {
            return res.status(404).send(`<script>alert("Destination not found."); window.location.href = "/";</script>`);
        }

        // Calculate total price based on package and number of travelers
        // Here you can add logic to fetch package prices from database or calculate dynamically
        let packagePrice = 0;
        switch(package) {
            case "basic":
                packagePrice = 100; // Sample prices, replace with actual values
                break;
            case "standard":
                packagePrice = 200;
                break;
            case "premium":
                packagePrice = 300;
                break;
            default:
                packagePrice = 0;
        }
        const totalPrice = packagePrice * number_of_travelers;

        // Generate a unique booking ID
        const booking_id = generateDestinationBookingId();

        // Create a new DestinationBooking
        const newDestinationBooking = new DestinationBooking({
            booking_id: booking_id,
            destination_id: destination_id,
            user_id: req.session.user._id, // Assuming you have user session
            travel_date: new Date(travel_date),
            number_of_travelers: parseInt(number_of_travelers),
            package: package,
            total_price: totalPrice,
            booking_status: 'pending',
            payment_status: 'pending'
        });

        // Save the DestinationBooking to the database
        await newDestinationBooking.save();

        // Redirect to the payment page with the new booking ID
        res.send(`<script>alert("Booking on the way!"); window.location.href = "/desBook/destination/payment/${newDestinationBooking._id}?user=${encodeURIComponent(JSON.stringify(req.session.user))}";</script>`);
    } catch (error) {
        console.error('Error confirming DestinationBooking:', error);
        res.status(500).send(`<script>alert("Internal Server Error. Please try again later."); window.location.href = "/";</script>`);
    }
});


router.get('/destination/payment/:id',isLoggedIn, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await DestinationBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).send(`<script>alert("Booking not found."); window.location.href = "/?user=${encodeURIComponent(JSON.stringify(req.session.user))}";</script>`);
        }
        res.render('user/destinationPayment', { booking: booking });
    } catch (error) {
        console.error('Error fetching booking for payment:', error);
        res.status(500).send(`<script>alert("Internal Server Error. Please try again later."); window.location.href = "/";</script>`);
    }
});

router.post('/destination/payment/process',isLoggedIn, async (req, res) => {
    try {
        const { booking_id, card_number, card_expiry, card_cvv } = req.body;

        // Simulate payment processing (you should replace this with your actual payment processing logic)
        // Here we're just checking if the card number is not empty
        if (!card_number.trim()) {
            return res.status(400).send(`<script>alert("Invalid card information."); window.location.href = "/";</script>`);
        }

        // Find the booking
        const booking = await DestinationBooking.findById(booking_id);
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

router.get('/user-destination-bookings', isLoggedIn, async (req, res) => {
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

        const destinationBookings = await DestinationBooking.find({ user_id: userId });

        // Pass destinationBookings as bookings to the EJS template
        res.render('user/userDestinationBookings', { user: user, bookings: destinationBookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
