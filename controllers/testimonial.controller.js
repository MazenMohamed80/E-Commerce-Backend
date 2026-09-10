const Testimonial = require("../models/testimonial.model");
const catchAsync = require("../utils/catchAsync.util");
const logger = require("../utils/logger.util");

const testimonialStatuses = ["pending", "approved", "declined"];

exports.createTestimonial = catchAsync(async (req, res) => {
  const { message, rating } = req.body;
  const numericRating = Number(rating);

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Testimonial message is required" });
  }

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res
      .status(400)
      .json({ error: "Rating must be an integer between 1 and 5" });
  }

  const testimonial = await Testimonial.create({
    user: req.user._id,
    message: message.trim(),
    rating: numericRating,
    status: "pending",
    isApproved: false,
    isNew: true,
  });

  logger.info(
    `New testimonial ${testimonial._id} created by user ${req.user._id}`,
  );

  return res.status(201).json({
    message:
      "Testimonial submitted successfully and is awaiting admin approval",
    data: testimonial,
  });
});

exports.getApprovedTestimonials = catchAsync(async (req, res) => {
  const testimonials = await Testimonial.find({
    $or: [
      { status: "approved" },
      { status: { $exists: false }, isApproved: true },
    ],
  })
    .populate("user", "name")
    .sort("-createdAt");

  return res.status(200).json({
    message: "Approved testimonials fetched successfully",
    data: testimonials,
  });
});

exports.getMyTestimonials = catchAsync(async (req, res) => {
  const testimonials = await Testimonial.find({ user: req.user._id }).sort(
    "-createdAt",
  );

  return res.status(200).json({
    message: "Your testimonials fetched successfully",
    data: testimonials,
  });
});

exports.getAllTestimonialsForAdmin = catchAsync(async (req, res) => {
  const testimonials = await Testimonial.find()
    .populate("user", "name email")
    .sort({ isNew: -1, createdAt: -1 });

  return res.status(200).json({
    message: "Testimonials fetched successfully",
    data: testimonials,
  });
});

exports.getNewTestimonialNotifications = catchAsync(async (req, res) => {
  const testimonials = await Testimonial.find({ isNew: true })
    .populate("user", "name")
    .sort("-createdAt");

  return res.status(200).json({
    message: "New testimonial notifications fetched successfully",
    count: testimonials.length,
    data: testimonials,
  });
});

exports.markTestimonialNotificationsRead = catchAsync(async (req, res) => {
  const result = await Testimonial.updateMany(
    { isNew: true },
    { $set: { isNew: false } },
  );

  return res.status(200).json({
    message: "Testimonial notifications marked as read",
    modifiedCount: result.modifiedCount,
  });
});

exports.updateTestimonialStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!testimonialStatuses.includes(status)) {
    return res.status(400).json({
      error: "Status must be pending, approved, or declined",
    });
  }

  const testimonial = await Testimonial.findById(id);
  if (!testimonial) {
    return res.status(404).json({ error: "Testimonial not found" });
  }

  testimonial.status = status;
  testimonial.isApproved = status === "approved";
  testimonial.isNew = false;
  await testimonial.save();

  logger.info(
    `Admin ${req.user._id} changed testimonial ${id} status to ${status}`,
  );

  return res.status(200).json({
    message: "Testimonial status updated successfully",
    data: testimonial,
  });
});
