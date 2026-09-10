const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  addresses: [
    {
      title: { type: String, required: true },
      address: { type: String, required: true },
      deliveryFee: { type: Number, required: true, default: 50 },
      isDefault: { type: Boolean, default: false },
    },
  ],
  phone: {
    type: String,
    required: true,
  },
  DOB: {
    type: Date,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  prevOrders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
  ],
  cart: {
    numOfProducts: { type: Number, default: 0 },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        priceAtOrder: { type: Number, required: true },
        isPriceChanged: { type: Boolean, default: false },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, default: 0 },
    hasPriceChangedItems: { type: Boolean, default: false },
  },
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});
userSchema.methods.isCorrectPass = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};
const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
