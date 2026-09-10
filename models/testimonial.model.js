const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    // Kept for compatibility with the original model/data.
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Admin notification flag. It becomes false when the admin marks new
    // testimonial notifications as read or when the testimonial is reviewed.
    isNew: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const testimonialModel = mongoose.model("testimonial", testimonialSchema);

module.exports = testimonialModel;
