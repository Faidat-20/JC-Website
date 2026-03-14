const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: {
    type: String,        // <-- add this
    required: false,      // we can add it later during newsletter signup
  },

  otp: { 
    type: String 
  },

  otpExpiry: {
    type: Number
  },

  isSubscribed: { 
    type: Boolean, 
    default: false 
  },

  cart: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);