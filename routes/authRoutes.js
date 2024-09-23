const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const validator = require("validator");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const cookieParser = require('cookie-parser'); 

const uploadDir = "../uploads/user-pic/";
const defaultImagePath = "/images/default/default-user.jpg";

function ensureDirectoryExists(dirPath) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        return true;
    } catch (err) {
        console.error("Error creating directory:", err);
        return false;
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        ensureDirectoryExists(path.join(__dirname, uploadDir));
        cb(null, path.join(__dirname, uploadDir));
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Example: Limit to 5MB
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(
                new Error("Please upload an image file (jpg, jpeg, or png).")
            );
        }
        cb(null, true);
    },
});

router.use(cookieParser());

function checkAuthentication(req, res, next) {
    if (req.session && req.session.userId) {  
        req.isLoggedIn = true;  
    } else {
        req.isLoggedIn = false; 
    }
    next(); 
}

router.get("/register", checkAuthentication, (req, res) => {
    let user = req.session.user || null; 
    res.render("user/register", { message: {}, user, isLoggedIn: res.locals.isLoggedIn }); 
});

router.post("/register", upload.single("photo"), async (req, res) => {
    try {
        const { username, name, email, password, mobileNo } = req.body;

        const errors = []; // Array to collect validation errors

        if (!username || !name || !email || !password || !mobileNo) {
            errors.push("All fields are required");
        }

        if (!validator.isEmail(email)) {
            errors.push("Invalid email format");
        }

        if (!validator.isMobilePhone(mobileNo, 'any', { strictMode: false })) {
            errors.push("Invalid mobile number format");
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            errors.push("Username or email already exists");
        }

        if (errors.length > 0) {
            const errorString = errors.join("\n"); // Combine errors with newlines
            return res.redirect(`/auth/register?error=${encodeURIComponent(errorString)}`);
        }
        
        // If no errors, proceed to create and save the new user 
        const newUser = new User({
            username,
            name,
            email,
            password, // Assuming password is already hashed
            mobileNo
        });

        if (req.file) {
            newUser.photo = req.file.filename;
        }

        await newUser.save();

        res.redirect("/auth/login?message=Registration successful. Please login.");
    } catch (error) {
        console.error("Error occurred during registration:", error);
        res.redirect(`/auth/register?error=${encodeURIComponent("Server Error")}`);
    }
});


router.get("/logout", async (req, res) => {
    try {
        delete req.session.returnTo;
        req.session.destroy();
        res.clearCookie('username');
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get("/login", (req, res) => {
    req.session.returnTo = req.header('Referer') || '/';
    res.render("user/login", { error: null, user: null });
});

router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        }).select("+password");

        if (!user) {
            return res.status(401).render("user/login", {
                error: "Invalid email or username", user: null
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).render("user/login", {
                error: "Invalid password.", user: null
            });
        }

        req.session.isLoggedIn = true;
        req.session.user = {
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            mobileNo: user.mobileNo,
            role: user.role,
            photo: user.photo,
        };

        res.cookie('username', user.username, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });

        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(returnTo);
    } catch (err) {
        console.error("Error occurred during login:", err);
        res.status(500).render("user/login", {
            error: "An error occurred during login. Please try again.", user: null
        });
    }
});

module.exports = router;
