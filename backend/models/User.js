const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  otp: { 
    type: String 
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