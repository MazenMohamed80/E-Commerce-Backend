const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  addAddress,
  updateAddress,
  toggleBlockUser,
  updateAddressDeliveryFeeByAdmin,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.get("/", authenticate, authorize("admin"), getAllUsers);
router.post("/", createUser("user"));
router.post("/admin", authenticate, authorize("admin"), createUser("admin"));
router.patch("/:id/block", authenticate, authorize("admin"), toggleBlockUser);
router.patch(
  "/:id/address/:title/delivery-fee",
  authenticate,
  authorize("admin"),
  updateAddressDeliveryFeeByAdmin,
);

router.post("/address", authenticate, addAddress);
router.put("/address/:title", authenticate, updateAddress);

module.exports = router;
