const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const logger = require("../utils/logger.util");
const catchAsync = require("../utils/catchAsync.util");

exports.createOrder = catchAsync(async (req, res) => {
  const { addressTitle } = req.body;

  const myUser = await User.findById(req.user.id).populate(
    "cart.products.product",
  );
  if (!myUser) return res.status(404).json({ error: "User not found" });

  if (!myUser.cart || myUser.cart.products.length === 0) {
    return res
      .status(400)
      .json({ error: "Cannot place order with an empty cart" });
  }

  const priceChangedItem = myUser.cart.products.find(
    (pro) => pro.isPriceChanged,
  );
  if (priceChangedItem || myUser.cart.hasPriceChangedItems) {
    return res.status(400).json({
      error:
        "Some items in your cart have price updates. Please confirm or update your cart first.",
    });
  }

  const selectedAddress =
    myUser.addresses.find(
      (addr) =>
        addr.title.toLowerCase().trim() ===
        (addressTitle || "").toLowerCase().trim(),
    ) ||
    myUser.addresses.find((addr) => addr.isDefault) ||
    myUser.addresses[0];

  if (!selectedAddress) {
    return res
      .status(400)
      .json({ error: "No shipping address provided or found on profile" });
  }

  const deliveryFee = selectedAddress.deliveryFee || 50;
  const shippingAddressString = `${selectedAddress.title}: ${selectedAddress.address}`;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems = [];

    for (const item of myUser.cart.products) {
      const product = await Product.findById(item.product._id).session(session);

      if (!product || product.isDeleted || !product.isActive) {
        throw new Error(
          `Product ${item.product.name || ""} is no longer available.`,
        );
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Ordered: ${item.quantity}`,
        );
      }

      product.stock -= item.quantity;
      product.salesCount = (product.salesCount || 0) + item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        priceAtOrder: item.priceAtOrder,
        quantity: item.quantity,
      });
    }

    const calculatedTotal = myUser.cart.totalPrice + deliveryFee;

    const [newOrder] = await Order.create(
      [
        {
          user: myUser._id,
          products: orderItems,
          shippingAddress: shippingAddressString,
          deliveryFee: deliveryFee,
          totalPrice: calculatedTotal,
          status: "pending",
        },
      ],
      { session },
    );

    myUser.prevOrders.push(newOrder._id);
    myUser.cart = {
      numOfProducts: 0,
      products: [],
      totalPrice: 0,
      hasPriceChangedItems: false,
    };
    await myUser.save({ session });

    await session.commitTransaction();
    session.endSession();

    logger.info(
      `Order placed successfully: ${newOrder._id} by user: ${myUser._id}`,
    );

    return res.status(201).json({
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ error: error.message });
  }
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("products.product")
    .sort("-orderedAt");

  res
    .status(200)
    .json({ message: "Orders fetched successfully", data: orders });
});

exports.getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email phone")
    .populate("products.product")
    .sort("-orderedAt");

  logger.info(`Admin ${req.user._id} fetched all orders`);
  res
    .status(200)
    .json({ message: "All orders fetched successfully", data: orders });
});

exports.updateOrderStatusByAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "in_progress",
    "confirmed",
    "shipped",
    "delivered",
    "refund_requested",
    "refunded",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status transition" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  await order.save();

  logger.info(`Admin ${req.user._id} updated order ${id} status to ${status}`);
  return res
    .status(200)
    .json({ message: "Order status updated successfully", data: order });
});

exports.requestRefundByUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user.id });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== "delivered") {
    return res.status(400).json({
      error: "Refund can only be requested once the order status is delivered",
    });
  }

  order.status = "refund_requested";
  await order.save();

  return res.status(200).json({
    message: "Refund requested successfully. Admin will review your request.",
    data: order,
  });
});

exports.cancelOrderByUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({ _id: id, user: req.user.id });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const nonCancellableStatuses = [
    "confirmed",
    "shipped",
    "delivered",
    "refund_requested",
    "refunded",
    "cancelled",
  ];
  if (nonCancellableStatuses.includes(order.status)) {
    return res.status(400).json({
      error: "This order can no longer be cancelled.",
    });
  }

  order.status = "cancelled";
  await order.save();
  return res.status(200).json({
    message: "Order cancelled successfully",
    data: order,
  });
});

exports.getSalesReport = catchAsync(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res
      .status(400)
      .json({ error: "Both from and to dates are required." });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return res.status(400).json({ error: "Invalid date range." });
  }
  if (fromDate > toDate) {
    return res
      .status(400)
      .json({ error: "The from date must be before or equal to the to date." });
  }

  toDate.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    orderedAt: { $gte: fromDate, $lte: toDate },
    status: { $nin: ["cancelled"] },
  }).select("products totalPrice deliveryFee orderedAt");

  let revenue = 0;
  const productSales = new Map();

  for (const order of orders) {
    revenue += order.totalPrice;
    for (const item of order.products) {
      const id = item.product.toString();
      productSales.set(id, (productSales.get(id) || 0) + item.quantity);
    }
  }

  const topIds = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const productDocs = topIds.length
    ? await Product.find({ _id: { $in: topIds.map(([id]) => id) } })
    : [];

  const topProducts = topIds
    .map(([id, quantity]) => {
      const product = productDocs.find((p) => p._id.toString() === id);
      return product ? { product, quantity } : null;
    })
    .filter(Boolean);

  return res.status(200).json({
    message: "Sales report fetched successfully",
    data: {
      from: fromDate,
      to: toDate,
      revenue,
      ordersCount: orders.length,
      topProducts,
    },
  });
});
