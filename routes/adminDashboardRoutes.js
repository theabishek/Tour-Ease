const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const Hotel = require("../models/Hotel");
const Destination = require("../models/Destination"); // Correctly import Destination model
const Submission = require('../models/Submission');
const multer = require('multer');
const path = require('path');
const { getTotalHotelsCount, getTotalDestinationsCount, getTotalBookingsCount, getTotalPassengersCount } = require('../models/Aggregation');
const router = express.Router();

// Multer configuration for hotel image uploads
const hotelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/hotels/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const hotelUpload = multer({ storage: hotelStorage });

// Multer configuration for destination image uploads
const destinationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/destinations/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const destinationUpload = multer({ storage: destinationStorage });

// Route to render the edit form with current details
router.get('/edit-destination/:id', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).send('Destination not found');
        }
        res.render('admin/edit-destination', { destination });
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the form submission
router.post('/edit-destination/:id', destinationUpload.array('images', 10), async (req, res) => {
    try {
        const { destinationName, country, activities, bestFor, transportOptions, description, languages, cuisine, bestTime } = req.body;

        // Process uploaded files
        let images = req.files.map(file => file.path.replace(/\\/g, '/')); // Convert backslashes to forward slashes

        // Find destination by ID and update it
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).send('Destination not found');
        }

        destination.destinationName = destinationName;
        destination.country = country;
        destination.activities = activities.split(',');
        destination.bestFor = bestFor.split(',');
        destination.transportOptions = transportOptions.split(',');
        destination.description = description;
        destination.languages = languages.split(',');
        destination.cuisine = cuisine.split(',');
        destination.bestTime = bestTime.split(',');
        destination.images = images;

        await destination.save();
        res.redirect('/destinations');
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/edit-hotel/:id', async (req, res) => {
    try {
        // Fetch the hotel by ID
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }

        // Render the edit hotel page with the fetched hotel data and no errors
        res.render('admin/edit-hotel', {
            hotel,
            errors: [] // Ensure errors is always defined
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/edit-hotel/:id', hotelUpload.array('images', 10), async (req, res) => {
    const errors = [];
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }

        // Validate and update fields
        if (!req.body.hotelName) {
            errors.push('Hotel Name is required');
        }

        if (errors.length > 0) {
            return res.render('admin/edit-hotel', {
                hotel: { ...hotel._doc, ...req.body }, // Preserve existing data
                errors
            });
        }

        // Update fields
        hotel.hotelName = req.body.hotelName || hotel.hotelName;
        hotel.location.city = req.body.city || hotel.location.city;
        hotel.location.country = req.body.country || hotel.location.country;
        hotel.description = req.body.description || hotel.description;
        hotel.amenities = req.body.amenities || hotel.amenities;
        hotel.contact.phone = req.body.phone || hotel.contact.phone;
        hotel.contact.email = req.body.email || hotel.contact.email;
        hotel.contact.website = req.body.website || hotel.contact.website;
        hotel.policies.checkInTime = req.body.checkInTime || hotel.policies.checkInTime;
        hotel.policies.checkOutTime = req.body.checkOutTime || hotel.policies.checkOutTime;
        hotel.policies.cancellationPolicy = req.body.cancellationPolicy || hotel.policies.cancellationPolicy;
        hotel.priceRange = [
            req.body.priceLow || hotel.priceRange[0],
            req.body.priceHigh || hotel.priceRange[1]
        ];

        // Handle image uploads
        if (req.files) {
            const newImages = req.files.map(file => file.path.replace('\\', '/'));
            hotel.images = [...hotel.images, ...newImages];
        }

        await hotel.save();
        res.redirect('/adminDashboard/manage-hotel');
    } catch (err) {
        console.error(err);
        errors.push('Error updating hotel');
        res.render('admin/edit-hotel', {
            hotel: { ...req.body }, // Preserve submitted data
            errors
        });
    }
});


// Middleware to check if admin is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect('/adminDashboard/home'); // Redirect to dashboard if already logged in
    }
    next();
};

// Middleware to check if admin is not logged in
const ensureAuthenticated = (req, res, next) => {
    if (!req.session.admin) {
        return res.redirect('/adminDashboard/login');
    }
    next();
};

// Render the login page
router.get('/login', isAuthenticated, (req, res) => {
    res.render('admin/admin-login');
});

// Render the login page
router.get('/', isAuthenticated, (req, res) => {
    res.redirect('/adminDashboard/home');
});

// Handle login form submission
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    const admin = await Admin.findOne({
        $or: [{ username: login }, { email: login }]
    });

    if (admin && await bcrypt.compare(password, admin.password)) {
        req.session.admin = admin;
        res.redirect('/adminDashboard/home');
    } else {
        res.send('Invalid credentials');
    }
});

// Render the registration page
router.get('/register', isAuthenticated, (req, res) => {
    res.render('admin/admin-register');
});

// Handle registration form submission
router.post('/register', async (req, res) => {
    const { username, password, name, email } = req.body;

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }]
    });

    if (existingAdmin) {
        return res.send('Username or email already exists');
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
        username,
        password: hashedPassword,
        name,
        email
    });

    try {
        await newAdmin.save();
        res.redirect('/adminDashboard/login');
    } catch (err) {
        console.error('Error registering admin:', err);
        res.send('Error registering admin');
    }
});

// Admin Home (protected route)
router.get('/home', ensureAuthenticated, async (req, res) => {
    try {
        const totalHotels = await getTotalHotelsCount();
        const totalDestinations = await getTotalDestinationsCount();
        const totalBookings = await getTotalBookingsCount();
        const totalPassengers = await getTotalPassengersCount();

        res.render('admin/admin-home', {
            body: 'partials/dashboard',
            totalHotels,
            totalDestinations,
            totalBookings,
            totalPassengers,
            adminName: req.session.admin.name // Pass admin's name to the template
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/adminDashboard/home');
        }
        res.clearCookie('connect.sid'); // Clear the correct session cookie
        res.redirect('/adminDashboard/login');
    });
});

// Route to fetch top 5 hotels
router.get('/top-hotels', ensureAuthenticated, async (req, res) => {
    try {
        const topHotels = await Hotel.find({})
            .sort({ rating: -1 })
            .limit(5)
            .exec();
        res.json(topHotels);
    } catch (error) {
        console.error('Error fetching top hotels:', error);
        res.status(500).send('Server error');
    }
});

// Route to fetch top 5 destinations
router.get('/top-destinations', ensureAuthenticated, async (req, res) => {
    try {
        const topDestinations = await Destination.find({})
            .sort({ rating: -1 })
            .limit(5)
            .exec();
        res.json(topDestinations);
    } catch (error) {
        console.error('Error fetching top destinations:', error);
        res.status(500).send('Server error');
    }
});

router.get('/query', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/adminDashboard/login');
    }

    try {
        const submissions = await Submission.find();
        res.render('admin/query', {
            submissions
        });
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Search destinations based on query parameters
router.get('/search-destinations', async (req, res) => {
    try {
        let query = {};

        // Search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            query = {
                $or: [
                    { destinationName: regex },
                    { country: regex },
                    { destID: regex }
                ]
            };
        }

        const destinations = await Destination.find(query);

        res.json({
            destinations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Delete a destination by ID
router.delete('/delete-destination/:id', async (req, res) => {
    try {
        await Destination.findByIdAndDelete(req.params.id);
        res.status(200).send('Destination deleted');
    } catch (error) {
        console.error('Error deleting destination:', error);
        res.status(500).send('Server error');
    }
});

// Route to search for hotels
router.get('/search-hotels', async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const regex = new RegExp(escapeRegex(searchQuery), 'i');

        const hotels = await Hotel.find({
            $or: [
                { hotelName: regex },
                { 'location.country': regex },
                { 'location.city': regex },
                { hotelID: regex }
            ]
        });

        res.json({ hotels });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Route to delete a hotel
router.delete('/delete-hotel/:id', async (req, res) => {
    try {
        await Hotel.findByIdAndDelete(req.params.id);
        res.status(200).send('Hotel deleted');
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Helper function to escape special characters in search queries
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get('/manage-destination', async (req, res) => {
    try {
        let query = {};
        
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            query = {
                $or: [
                    { destinationName: regex },
                    { country: regex }
                ]
            };
        }

        const destinations = await Destination.find(query);
        
        res.render('admin/manage-destination', {
            destinations,
            query: req.query
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/manage-hotel', async (req, res) => {
    try {
        // Fetch all hotels
        const hotels = await Hotel.find();

        // Render the manage hotels page with the list of hotels
        res.render('admin/manage-hotel', {
            hotels
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;