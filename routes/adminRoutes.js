const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Destination = require("../models/Destination");
const Hotel = require("../models/Hotel");
const router = express.Router();

// Function to ensure directory exists
const ensureDirectoryExists = (directory) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(directory, { recursive: true }, (err) => {
            if (err) {
                if (err.code === "EEXIST") {
                    resolve();
                } else {
                    reject(err);
                }
            } else {
                resolve();
            }
        });
    });
};

// Multer Setup with Dynamic Destination
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, req.destinationPath); // Set destination path directly from the request object
    },
    filename: function (req, file, cb) {
        const namePrefix = req.body.destination_name ? req.body.destination_name.substring(0, 3).toUpperCase() : "IMG"; // Fixed the condition for destination name
        cb(null, namePrefix + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const uploadMiddleware = (destinationPath) => {
    return [
        (req, res, next) => {
            req.destinationPath = destinationPath; // Set the destination path in the request object
            ensureDirectoryExists(destinationPath)
                .then(() => {
                    upload.array("images")(req, res, (err) => {
                        if (err) {
                            console.error("Error uploading images:", err);
                            return res.status(500).send("Error uploading images");
                        }
                        next();
                    });
                })
                .catch((err) => {
                    console.error("Error ensuring directory exists:", err);
                    res.status(500).send("Internal Server Error");
                });
        },
    ];
};

// Route to render the destination form
router.get("/addDestination", (req, res) => {
    res.render("admin/addDestinations");
});

// Route to handle destination addition
router.post("/addDestination", uploadMiddleware("uploads/destinations/"), async (req, res) => {
    try {
        const {
            destID,
            destination_name,
            country,
            activities,
            best_for,
            transport_options,
            description,
            languages,
            cuisine,
            best_time,
            rating,
        } = req.body;

        // Extract image file paths
        const images = req.files.map((file) => file.path);

        // Save the new destination to the database
        const newDestination = new Destination({
            destID,
            destinationName: destination_name,
            country,
            activities: activities.split(",").map((activity) => activity.trim()),
            bestFor: best_for.split(",").map((best) => best.trim()),
            transportOptions: transport_options.split(",").map((transport) => transport.trim()),
            description,
            images,
            languages: languages.split(",").map((lang) => lang.trim()),
            cuisine: cuisine.split(",").map((item) => item.trim()),
            bestTime: best_time.split(",").map((time) => time.trim()),
            rating: parseFloat(rating),
        });

        await newDestination.save();

        res.redirect("/destinations");
    } catch (err) {
        console.error("Error adding destination:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render the hotel form
router.get("/addHotel", (req, res) => {
    res.render("admin/addHotel");
});

// Route to handle hotel addition
router.post("/addHotel", uploadMiddleware("uploads/hotels/"), async (req, res) => {
    try {
        const hotelData = req.body;

        // Process rooms data (assuming array structure)
        const rooms = hotelData.rooms.map((room) => ({
            roomType: room.roomType,
            roomPrice: parseFloat(room.roomPrice), // Convert roomPrice to float
            roomCapacity: parseInt(room.roomCapacity), // Convert roomCapacity to int
            totalRooms: parseInt(room.totalRooms), // Convert totalRooms to int
            description: room.description,
        }));

        // Calculate price range based on room prices
        const roomPrices = rooms.map((room) => room.roomPrice);
        
        // Filter out NaN values and calculate price range
        const validRoomPrices = roomPrices.filter(price => !isNaN(price));
        const priceRange = validRoomPrices.length > 0 ? [Math.min(...validRoomPrices), Math.max(...validRoomPrices)] : [0, 0];

        const images = req.files ? req.files.map((file) => file.path) : [];

        const newHotel = new Hotel({
            hotelID: hotelData.hotelID,
            hotelName: hotelData.hotelName,
            location: hotelData.location,
            description: hotelData.description,
            amenities: hotelData.amenities.split(",").map((item) => item.trim()),
            contact: {
                phone: hotelData.contact.phone,
                email: hotelData.contact.email,
                website: hotelData.contact.website,
            },
            policies: {
                checkInTime: hotelData.policies.checkInTime,
                checkOutTime: hotelData.policies.checkOutTime,
                cancellationPolicy: hotelData.policies.cancellationPolicy,
            },
            priceRange: priceRange, // Use calculated price range
            images: images,
            rooms: rooms,
        });

        await newHotel.save();
        res.redirect("/hotels");
    } catch (error) {
        console.error("Error adding hotel:", error);
        res.render("admin/addHotel", { error: "Error saving hotel data" });
    }
});


// Route to generate a unique destination or hotel ID
router.get("/generateID", (req, res) => {
    let prefix = "";
    if (req.query.type === "hotel") {
        prefix = "HTL";
    } else {
        prefix = "DEST";
    }
    const uniqueID = prefix + Date.now();

    res.json({ uniqueID });
});

module.exports = router;
