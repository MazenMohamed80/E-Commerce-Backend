const express = require("express");
const router = express.Router();
const cart = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

router.get("/", authenticate, authorize("user"), cart.getCart);
router.post("/merge", authenticate, authorize("user"), cart.mergeCart);
router.post("/:slug", authenticate, authorize("user"), cart.addCart);
router.patch(
  "/accept-price/:slug",
  authenticate,
  authorize("user"),
  cart.acceptPriceChange,
);
router.delete("/:slug", authenticate, authorize("user"), cart.deleteCart);

module.exports = router;
