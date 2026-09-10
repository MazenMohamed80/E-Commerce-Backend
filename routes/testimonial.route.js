const express = require("express");
const router = express.Router();
const {
  createTestimonial,
  getApprovedTestimonials,
  getMyTestimonials,
  getAllTestimonialsForAdmin,
  getNewTestimonialNotifications,
  markTestimonialNotificationsRead,
  updateTestimonialStatus,
} = require("../controllers/testimonial.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.get("/", getApprovedTestimonials);

router.post("/", authenticate, authorize("user"), createTestimonial);
router.get("/my", authenticate, authorize("user"), getMyTestimonials);

// Admin testimonial review + notifications.
router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  getAllTestimonialsForAdmin,
);
router.get(
  "/admin/notifications",
  authenticate,
  authorize("admin"),
  getNewTestimonialNotifications,
);
router.patch(
  "/admin/notifications/read",
  authenticate,
  authorize("admin"),
  markTestimonialNotificationsRead,
);
router.patch(
  "/admin/:id/status",
  authenticate,
  authorize("admin"),
  updateTestimonialStatus,
);

module.exports = router;
