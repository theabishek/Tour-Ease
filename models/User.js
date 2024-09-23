// models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "Please provide a username"],
		unique: true,
		lowercase: true,
		trim: true,
	},
	name: {
		type: String,
		required: [true, "Please provide your name"],
		trim: true,
	},
	email: {
		type: String,
		required: [true, "Please provide your email"],
		unique: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: [true, "Please provide a password"],
		minlength: 8,
		select: false,
	},
	mobileNo: {
		type: String,
		required: [true, "Please provide your mobile number"],
	},
	role: {
		type: String,
		enum: ["user"],
		default: "user",
	},
	photo: {
		type: String,
		default: "default.jpg",
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
	console.log("Pre-save middleware triggered"); // Verify execution
	console.log("Password before hashing:", this.password);

	if (!this.isModified("password")) return next();

	this.password = await bcrypt.hash(this.password, 12);
	console.log("Password after hashing:", this.password);

	next();
});

userSchema.methods.comparePassword = async function (
	enteredPassword,
	storedPassword 
) {
	return await bcrypt.compare(enteredPassword, storedPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
