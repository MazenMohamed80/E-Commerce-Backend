const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imgURL: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    season: {
      type: String,
      enum: ["summer", "winter"],
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["men", "women"],
    },
    subCategory: {
      type: String,
      required: true,
      enum: ["pants", "shirts", "socks", "hats", "tops", "bottoms"],
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: "text", desc: "text" });

const ProductModel = mongoose.model("product", productSchema);
module.exports = ProductModel;
