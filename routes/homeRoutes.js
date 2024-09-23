const express = require("express");
const router = express.Router();
const Destination = require("../models/Destination");
const Hotel = require("../models/Hotel");
const Submission = require("../models/Submission");
const User = require("../models/User"); // Make sure this path is correct

router.get("/", async (req, res) => {
  try {
      const hotels = await Hotel.find().limit(4); // Fetching 4 hotels
      const destinations = await Destination.find().limit(4); // Fetching 4 destinations

      res.render("user/home", { 
          user: req.session.user,
          hotels: hotels,
          destinations: destinations
      });
  } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
  }
});


router.get("/contactUs", (req, res) => {
	res.render("user/contactUs", { user: req.session.user });
});

const ITEMS_PER_PAGE = 8; 
router.get("/destinations", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = page * ITEMS_PER_PAGE;

        let query = {};
        let sort = {};

        // Search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            query = {
                $or: [
                    { destinationName: regex },
                    { country: regex }
                ]
            };
        }

        // Sort
        if (req.query.sort) {
            switch (req.query.sort) {
                case "nameAsc":
                    sort = { destinationName: 1 };
                    break;
                case "nameDesc":
                    sort = { destinationName: -1 };
                    break;
                case "countryAsc":
                    sort = { country: 1 };
                    break;
                case "countryDesc":
                    sort = { country: -1 };
                    break;
                case "ratingAsc":
                    sort = { rating: 1 };
                    break;
                case "ratingDesc":
                    sort = { rating: -1 };
                    break;
                case "priceLow":
                    sort = { price: 1 };
                    break;
                case "priceHigh":
                    sort = { price: -1 };
                    break;
                default:
                    break;
            }
        }

        const totalDestinations = await Destination.countDocuments(query);
        const destinations = await Destination.find(query)
            .sort(sort)
            .limit(ITEMS_PER_PAGE)
            .skip(startIndex);

        const hasNextPage = endIndex < totalDestinations;
        const hasPreviousPage = page > 1;

        res.render("user/allDestinations", {
            destinations,
            currentPage: page,
            hasNextPage,
            hasPreviousPage,
            user: req.session.user,
            query: req.query 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
} 


// Route to handle requests for individual destination details
router.get('/destinations/:id', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).send('Destination not found');
        }
        console.log(destination)
        res.render('user/destinationDetails', { destination, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get("/hotels", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = page * ITEMS_PER_PAGE;
  
      let query = {};
      let sort = {};
  
      // Search
      if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        query = {
          $or: [
            { hotelName: regex },
            { 'location.country': regex },
            { 'location.city': regex } 
          ]
        };
      }
  
      // Sort
      if (req.query.sort) {
        switch (req.query.sort) {
          case "nameAsc":
            sort = { hotelName: 1 };
            break;
          case "nameDesc":
            sort = { hotelName: -1 };
            break;
          case "countryAsc":
            sort = { country: 1 };
            break;
          case "countryDesc":
            sort = { country: -1 };
            break;
          case "ratingAsc":
            sort = { rating: 1 };
            break;
          case "ratingDesc":
            sort = { rating: -1 };
            break;
          case "priceLow":
            sort = { priceRange: 1 }; // Assuming priceRange is an array 
            break;
          case "priceHigh":
            sort = { priceRange: -1 }; // Assuming priceRange is an array 
            break;
          default:
            break;
        }
      }
  
      const totalHotels = await Hotel.countDocuments(query);
      const hotels = await Hotel.find(query)
        .sort(sort)
        .limit(ITEMS_PER_PAGE)
        .skip(startIndex);
  
      const hasNextPage = endIndex < totalHotels;
      const hasPreviousPage = page > 1;
  
      res.render("user/allHotels", {
        hotels,
        currentPage: page,
        hasNextPage,
        hasPreviousPage,
        user: req.session.user,
        query: req.query 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });
  
// Route to handle requests for individual hotel details
router.get('/hotels/:id', async (req, res) => {
  try {
      const hotel = await Hotel.findById(req.params.id)
          .populate('reviews.user'); // Populate 'user' within reviews

      if (!hotel) {
          return res.status(404).send('Hotel not found');
      }

      res.render('user/hotelDetails', { hotel, reviews: hotel.reviews, user: req.session.user, availabilityMessage: null }); // Pass 'availabilityMessage' with a null value
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

router.post('/hotels/:id/reviews', async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Ensure the user is logged in
    if (!req.session.user) {
      return res.status(401).send('Unauthorized'); 
    }

    const hotelId = req.params.id;

    // Fetch the hotel by ID
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).send('Hotel not found');
    }

    // Create a new review
    const newReview = {
      user: req.session.user._id,
      comment,
      rating
    };
    hotel.reviews.push(newReview);

    await hotel.save(); // Save the updated hotel

    res.redirect(`/hotels/${hotelId}`); // Redirect to the hotel details page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/destinations/:id/reviews', async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Ensure the user is logged in
    if (!req.session.user) {
      return res.status(401).send('Unauthorized'); 
    }

    const destinationId = req.params.id;

    // Fetch the destination by ID
    const destination = await Destination.findById(destinationId);

    if (!destination) {
      return res.status(404).send('Destination not found');
    }

    // Create a new review
    const newReview = {
      user: req.session.user._id,
      comment,
      rating
    };
    destination.reviews.push(newReview);

    await destination.save(); // Save the updated destination

    res.redirect(`/destinations/${destinationId}`); // Redirect to the destination details page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.post('/hotels/:hotelId/reviews/:reviewId/delete', async (req, res) => {
  try {
      const { hotelId, reviewId } = req.params;

      // Ensure the user is logged in and has a valid user object in the session
      if (!req.session.user || !req.session.user._id) {
        return res.status(401).send('Unauthorized'); 
      }

      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).send('Hotel not found');
      }

      const reviewIndex = hotel.reviews.findIndex(review => review._id.equals(reviewId));

      if (reviewIndex === -1) {
          return res.status(404).send('Review not found');
      }

      // Check if the review belongs to the current user
      if (req.session.user._id.toString() === hotel.reviews[reviewIndex].user.toString()) {
          hotel.reviews.splice(reviewIndex, 1); // Remove the review
          await hotel.save(); // Save the updated hotel
          res.redirect(`/hotels/${hotelId}`); // Redirect to the hotel details page
      } else {
          res.status(403).send('Unauthorized');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

router.post('/destinations/:destinationId/reviews/:reviewId/delete', async (req, res) => {
  try {
    const { destinationId, reviewId } = req.params;

    // Ensure the user is logged in and has a valid user object in the session
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).send('Unauthorized');
    }

    const destination = await Destination.findById(destinationId);

    if (!destination) {
      return res.status(404).send('Destination not found');
    }

    const reviewIndex = destination.reviews.findIndex(review => review._id.equals(reviewId));

    if (reviewIndex === -1) {
      return res.status(404).send('Review not found');
    }

    // Check if the review belongs to the current user
    if (req.session.user._id.toString() === destination.reviews[reviewIndex].user.toString()) {
      destination.reviews.splice(reviewIndex, 1); // Remove the review
      await destination.save(); // Save the updated destination
      res.redirect(`/destinations/${destinationId}`); // Redirect to the destination details page
    } else {
      res.status(403).send('Unauthorized');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get("/thankyou", (req, res) => {
	res.render("user/thankyou", { user: req.session.user });
});

router.get("/aboutus", (req, res) => {
	res.render("user/aboutus", { user: req.session.user });
});

router.post('/submitQuery', async (req, res) => {
  const { firstname, lastname, email, inquiry, message } = req.body;

  try {
      const submission = new Submission({
          firstname,
          lastname,
          email,
          inquiry,
          message
      });

      await submission.save();
      res.redirect("/");
  } catch (err) {
      res.status(500).send('Error submitting form');
  }
});

router.get("/users/:username/edit", async (req, res) => {
  try {
      const username = req.params.username;
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(404).send({ error: "User not found!" });
      }

      res.render("user/editUser", { user });
  } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Server error!" });
  }
});

// Update user details route
router.post("/users/:username/edit", async (req, res) => {
  try {
      const username = req.params.username;
      const updates = req.body;
      const allowedUpdates = ["name", "email", "mobileNo"];
      
      // Check if all updates are allowed
      const isValidUpdate = Object.keys(updates).every(update => allowedUpdates.includes(update));
      
      if (!isValidUpdate) {
          return res.status(400).send({ error: "Invalid updates!" });
      }

      // Check if newPassword and confirmPassword are provided and match
      if (req.body.newPassword && req.body.newPassword === req.body.confirmPassword) {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
          updates.password = hashedPassword;
      }

      const user = await User.findOneAndUpdate({ username }, updates, { new: true });

      if (!user) {
          return res.status(404).send({ error: "User not found!" });
      }

      res.redirect(`/users/${username}/edit`);
  } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Server error!" });
  }
});


module.exports = router;