const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatusByAdmin,
  requestRefundByUser,
  cancelOrderByUser,
  getSalesReport,
} = require("../controllers/order.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

// User routes
router.post("/", authenticate, authorize("user"), createOrder);
router.get("/my-orders", authenticate, authorize("user"), getMyOrders);
router.patch(
  "/:id/refund",
  authenticate,
  authorize("user"),
  requestRefundByUser,
  cancelOrderByUser,
  getSalesReport,
);
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("user"),
  cancelOrderByUser,
  getSalesReport,
);

// Admin routes
router.get("/admin", authenticate, authorize("admin"), getAllOrders);
router.get("/admin/report", authenticate, authorize("admin"), getSalesReport);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  updateOrderStatusByAdmin,
);

module.exports = router;
