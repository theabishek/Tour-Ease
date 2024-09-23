const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const destinationBookRoutes = require('./routes/destinationBookRoutes');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourease_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB', err));

// Serve static files with cache control
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d' }));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    name: 'session',
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware to make session user available to views
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.user = {
            _id: req.session.user._id,
            username: req.session.user.username,
            name: req.session.user.name,
            photo: req.session.user.photo
        };
    }
    next();
});

// Define routes
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/booking', bookingRoutes);
app.use('/desBook', destinationBookRoutes);
app.use('/adminDashboard', adminDashboardRoutes);

// 404 error handler
app.use((req, res, next) => {
    res.status(404).send("Sorry, the requested page doesn't exist.");
});

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong! Please try again later.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
