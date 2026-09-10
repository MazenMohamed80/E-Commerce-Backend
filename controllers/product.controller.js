const Product = require("../models/product.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const AppError = require("../utils/appError.util");
const catchAsync = require("../utils/catchAsync.util");
const logger = require("../utils/logger.util");
const cache = require("../utils/memoryCache.util");
const cacheKey = "productList";
const key = "keyword";

exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, desc, price, stock, season, slug, category, subCategory } =
    req.body;
  if (!req.file) {
    return next(new AppError("Product image is required", 400));
  }
  const imgURL = req.file.filename;

  const myProduct = await Product.create({
    name,
    desc,
    price,
    stock,
    slug,
    imgURL,
    season,
    category,
    subCategory,
  });

  cache.del(cacheKey);
  res.status(201).json({
    message: "Product Created Successfully",
    data: myProduct,
  });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const cachedProducts = cache.get(cacheKey);
  const prevKeyWord = cache.get(key);
  const keyWord = req.query.keyword || "";
  const season = req.query.season;
  const category = req.query.category;
  const subCategory = req.query.subCategory;

  let query = { isDeleted: false, isActive: true };

  if (season) query.season = season;
  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;

  let myProducts;

  if (
    cachedProducts &&
    prevKeyWord == keyWord &&
    !season &&
    !category &&
    !subCategory
  ) {
    return res.status(200).json({
      message: "Cache Fetched Successfully",
      data: cachedProducts,
    });
  }

  if (keyWord !== "") {
    query.$text = { $search: keyWord };
    myProducts = await Product.find(query, {
      score: { $meta: "textScore" },
    }).sort({ score: { $meta: "textScore" } });
  } else {
    myProducts = await Product.find(query);
  }

  if (!keyWord && !season && !category && !subCategory) {
    cache.set(cacheKey, myProducts);
    cache.set(key, keyWord);
  }

  if (myProducts.length > 0) {
    logger.info("Products listed");
    return res
      .status(200)
      .json({ message: "Products Fetched Successfully", data: myProducts });
  } else {
    logger.warn("Products List: No products found");
    return res.status(200).json({
      message: "Products Fetched Successfully BUT Length = 0",
      data: myProducts,
    });
  }
});

exports.getAllProductsForAdmin = catchAsync(async (req, res) => {
  const products = await Product.find().sort("-createdAt");
  res.status(200).json({
    message: "All products fetched successfully",
    data: products,
  });
});
exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const myProduct = await Product.findOne({
    slug,
    isDeleted: false,
    isActive: true,
  });
  if (myProduct) {
    return res
      .status(200)
      .json({ message: `Product is Found by slug: ${slug}`, data: myProduct });
  }
  next(new AppError(`can't find product with slug: ${slug}`, 404));
});

exports.getNewArrivals = catchAsync(async (req, res, next) => {
  const products = await Product.find({ isDeleted: false, isActive: true })
    .sort("-createdAt")
    .limit(10);

  res.status(200).json({
    message: "New arrivals fetched successfully",
    data: products,
  });
});

exports.getTopSales = catchAsync(async (req, res, next) => {
  const products = await Product.find({ isDeleted: false, isActive: true })
    .sort("-salesCount")
    .limit(10);

  res.status(200).json({
    message: "Top sales fetched successfully",
    data: products,
  });
});

exports.getTop5OrderedProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ isDeleted: false })
    .sort("-salesCount")
    .limit(5);

  res.status(200).json({
    message: "Top 5 ordered products report fetched successfully",
    data: products,
  });
});
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const updateData = { ...req.body };

  if (req.file) {
    updateData.imgURL = req.file.filename;
  }

  const existingProduct = await Product.findOne({ slug });
  if (!existingProduct) {
    return next(new AppError(`Product not found with slug: ${slug}`, 404));
  }

  const isPriceModified =
    updateData.price !== undefined &&
    Number(updateData.price) !== existingProduct.price;

  const updatedProduct = await Product.findOneAndUpdate({ slug }, updateData, {
    new: true,
    runValidators: true,
  });

  if (isPriceModified) {
    const productId = new mongoose.Types.ObjectId(existingProduct._id);
    console.log(productId);
    await User.updateMany(
      { "cart.products.product": productId },
      {
        $set: {
          "cart.products.$[elem].isPriceChanged": true,
        },
      },
      {
        arrayFilters: [{ "elem.product": productId }],
      },
    );
  }
  cache.del(cacheKey);

  res.status(200).json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
});
exports.softDeleteProduct = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const product = await Product.findOne({ slug });
  console.log(product);
  if (!product) {
    return next(new AppError(`Product not found with slug: ${slug}`, 404));
  }
  product.isDeleted = !product.isDeleted;
  product.isActive = !product.isActive;
  await product.save();

  cache.del(cacheKey);
  res.status(200).json({
    message: "Product Updated successfully",
    data: product,
  });
});
