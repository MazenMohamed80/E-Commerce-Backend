const User = require("../models/user.model");
const Product = require("../models/product.model");
const catchAsync = require("../utils/catchAsync.util");

const calculateCartTotals = (cart) => {
  let totalPrice = 0;
  let numOfProducts = 0;
  let hasPriceChangedItems = false;

  cart.products.forEach((pro) => {
    totalPrice += pro.priceAtOrder * pro.quantity;
    numOfProducts += pro.quantity;
    if (pro.isPriceChanged) {
      hasPriceChangedItems = true;
    }
  });

  cart.totalPrice = totalPrice;
  cart.numOfProducts = numOfProducts;
  cart.hasPriceChangedItems = hasPriceChangedItems;
};

exports.getCart = catchAsync(async (req, res) => {
  const myUser = await User.findById(req.user.id).populate(
    "cart.products.product",
  );
  if (!myUser) return res.status(404).json({ message: "User not found" });

  myUser.cart.products.forEach((pro) => {
    if (pro.product && pro.priceAtOrder !== pro.product.price) {
      pro.isPriceChanged = true;
    }
  });

  calculateCartTotals(myUser.cart);
  await myUser.save();

  res
    .status(200)
    .json({ message: "Cart fetched successfully", data: myUser.cart });
});

exports.addCart = catchAsync(async (req, res) => {
  const productSlug = req.params.slug;
  const quantity = Math.max(1, parseInt(req.query.quantity, 10) || 1);

  const product = await Product.findOne({
    slug: productSlug,
    isDeleted: false,
    isActive: true,
  });
  if (!product) {
    return res
      .status(404)
      .json({ message: "There is no product with this slug" });
  }

  const myUser = await User.findById(req.user.id).populate(
    "cart.products.product",
  );
  const existingProduct = myUser.cart.products.find(
    (pro) => pro.product._id.toString() === product._id.toString(),
  );

  const targetQuantity = existingProduct
    ? existingProduct.quantity + quantity
    : quantity;

  if (targetQuantity > product.stock) {
    return res.status(400).json({
      message: `Cannot add more items than available in stock. Maximum available: ${product.stock}`,
    });
  }

  if (existingProduct) {
    existingProduct.quantity = targetQuantity;
    existingProduct.priceAtOrder = product.price;
    existingProduct.isPriceChanged = false;
  } else {
    myUser.cart.products.push({
      product: product._id,
      priceAtOrder: product.price,
      isPriceChanged: false,
      quantity: quantity,
    });
  }

  calculateCartTotals(myUser.cart);
  await myUser.save();
  await myUser.populate("cart.products.product");

  return res
    .status(200)
    .json({ message: "product added successfully", data: myUser.cart });
});

exports.deleteCart = catchAsync(async (req, res) => {
  const slug = req.params.slug;
  const quantity = req.query.quantity ? parseInt(req.query.quantity, 10) : null;

  const myUser = await User.findById(req.user.id).populate(
    "cart.products.product",
  );
  const existingProductIndex = myUser.cart.products.findIndex(
    (pro) => pro.product && pro.product.slug === slug,
  );

  if (existingProductIndex === -1) {
    return res.status(404).json({ error: "Product Not Found in cart" });
  }

  const existingProduct = myUser.cart.products[existingProductIndex];

  if (quantity && quantity < existingProduct.quantity) {
    existingProduct.quantity -= quantity;
  } else {
    myUser.cart.products.splice(existingProductIndex, 1);
  }

  calculateCartTotals(myUser.cart);
  await myUser.save();

  return res
    .status(200)
    .json({ message: "Modified Successfully", data: myUser.cart });
});

exports.acceptPriceChange = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const myUser = await User.findById(req.user.id).populate(
    "cart.products.product",
  );

  const existingProduct = myUser.cart.products.find((pro) => {
    console.log(pro);
    return pro.product.slug === slug;
  });

  if (!existingProduct) {
    return res.status(404).json({ error: "Product Not Found in cart" });
  }

  existingProduct.priceAtOrder = existingProduct.product.price;
  existingProduct.isPriceChanged = false;

  calculateCartTotals(myUser.cart);
  await myUser.save();

  return res
    .status(200)
    .json({ message: "Price updated and accepted", data: myUser.cart });
});

exports.mergeCart = catchAsync(async (req, res) => {
  const { guestCartItems } = req.body;
  if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
    return res.status(400).json({ message: "No items provided to merge" });
  }

  const myUser = await User.findById(req.user.id);

  for (const guestItem of guestCartItems) {
    const product = await Product.findById(guestItem.productId);
    if (!product || !product.isActive || product.isDeleted) continue;

    const existingProduct = myUser.cart.products.find(
      (pro) => pro.product.toString() === product._id.toString(),
    );

    const addQty = Math.max(1, guestItem.quantity || 1);

    if (existingProduct) {
      existingProduct.quantity = Math.min(
        existingProduct.quantity + addQty,
        product.stock,
      );
      existingProduct.priceAtOrder = product.price;
      existingProduct.isPriceChanged = false;
    } else {
      myUser.cart.products.push({
        product: product._id,
        priceAtOrder: product.price,
        isPriceChanged: false,
        quantity: Math.min(addQty, product.stock),
      });
    }
  }

  calculateCartTotals(myUser.cart);
  await myUser.save();
  await myUser.populate("cart.products.product");

  return res
    .status(200)
    .json({ message: "Guest cart merged successfully", data: myUser.cart });
});
