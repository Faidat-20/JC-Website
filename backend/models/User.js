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

  isAdmin: {
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
  ],

  deliveryDetails: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    address: String,
    country: String,
    state: String,
    city: String
  },

  shippingOption: {
    name: String,
    price: Number
  }
  
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);