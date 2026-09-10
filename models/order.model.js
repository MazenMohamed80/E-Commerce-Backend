const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  priceAtOrder: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    products: [orderItemSchema],
    shippingAddress: {
      type: String,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "confirmed",
        "shipped",
        "delivered",
        "refund_requested",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
