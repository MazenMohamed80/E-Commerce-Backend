const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductBySlug,
  getNewArrivals,
  getTopSales,
  getTop5OrderedProducts,
  getAllProductsForAdmin,
  updateProduct,
  softDeleteProduct,
} = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

router.get("/", getAllProducts);
router.get(
  "/admin/all",
  authenticate,
  authorize("admin"),
  getAllProductsForAdmin,
);
router.get("/new-arrivals", getNewArrivals);
router.get("/top-sales", getTopSales);
router.get(
  "/reports/top-5",
  authenticate,
  authorize("admin"),
  getTop5OrderedProducts,
  getAllProductsForAdmin,
);
router.get("/:slug", getProductBySlug);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("img"),
  createProduct,
);

router.put(
  "/:slug",
  authenticate,
  authorize("admin"),
  upload.single("img"),
  updateProduct,
);

router.delete("/:slug", authenticate, authorize("admin"), softDeleteProduct);

module.exports = router;
