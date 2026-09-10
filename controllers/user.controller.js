const User = require("../models/user.model");
const logger = require("../utils/logger.util");
const catchAsync = require("../utils/catchAsync.util");

exports.getAllUsers = catchAsync(async (req, res) => {
  const myUsers = await User.find()
    .populate("cart.products.product prevOrders")
    .select("-password");
  logger.info(`list all users by admin: ${req.user.name} - ${req.user._id}`);
  res
    .status(200)
    .json({ message: "Users Fetched Successfully", data: myUsers });
});

exports.createUser = (role) => {
  return catchAsync(async (req, res) => {
    const {
      name,
      email,
      password,
      gender,
      phone,
      nationalId,
      DOB,
      addresses,
      cart,
    } = req.body;
    const userData = {
      name,
      email,
      password,
      role,
      gender,
      phone,
      nationalId,
      DOB,
      ...(addresses && { addresses }),
      ...(cart && { cart }),
    };

    const myUser = await User.create(userData);
    const userResponse = myUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User Created Successfully",
      data: userResponse,
    });
  });
};

exports.addAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { title, address } = req.body;
  const myUser = await User.findById(userId).select("-password");

  const isDuplicate = myUser.addresses.some(
    (addr) =>
      addr.address.toLowerCase().trim() ===
        (address || "").toLowerCase().trim() ||
      addr.title.toLowerCase().trim() === (title || "").toLowerCase().trim(),
  );

  if (isDuplicate) {
    return res.status(409).json({ error: "Duplicated Address or title" });
  }

  const newAddress = {
    title,
    address,
    deliveryFee: 50,
    isDefault:
      myUser.addresses.length === 0 ? true : Boolean(req.body.isDefault),
  };

  if (newAddress.isDefault) {
    myUser.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  myUser.addresses.push(newAddress);
  await myUser.save();

  logger.info(`add new Address: ${req.user.name} - ${req.user._id}`);
  return res
    .status(200)
    .json({ message: "Address Addedd Successfully", data: myUser });
});

exports.updateAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const addTitle = req.params.title;
  const updateAddress = {
    title: req.body.title,
    address: req.body.address,
    governorate: req.body.governorate,
    isDefault: req.body.isDefault,
  };

  const myUser = await User.findById(userId);
  const existingAddress = myUser.addresses.find(
    (addr) => addr.title.toLowerCase().trim() === addTitle.toLowerCase().trim(),
  );

  if (existingAddress) {
    const isDuplicate = myUser.addresses.some(
      (addr) =>
        addr.title !== existingAddress.title &&
        (addr.address.toLowerCase().trim() ===
          (updateAddress.address || "").toLowerCase().trim() ||
          addr.title.toLowerCase().trim() ===
            (updateAddress.title || "").toLowerCase().trim()),
    );

    if (isDuplicate) {
      return res.status(409).json({
        error: "Duplicated Address or Title",
      });
    }

    if (updateAddress.isDefault) {
      myUser.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      existingAddress.isDefault = true;
    }

    if (updateAddress.address) existingAddress.address = updateAddress.address;
    if (updateAddress.title) existingAddress.title = updateAddress.title;
    if (updateAddress.governorate)
      existingAddress.governorate = updateAddress.governorate;

    await myUser.save();
    return res
      .status(200)
      .json({ message: "Updated Successfully", data: existingAddress });
  }

  return res.status(404).json({ error: "Address not found" });
});

exports.updateAddressDeliveryFeeByAdmin = catchAsync(async (req, res) => {
  const { id, title } = req.params;
  const deliveryFee = Number(req.body.deliveryFee);

  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return res
      .status(400)
      .json({ error: "Delivery fee must be a non-negative number" });
  }

  const myUser = await User.findById(id).select("-password");
  if (!myUser) return res.status(404).json({ error: "User not found" });

  const existingAddress = myUser.addresses.find(
    (addr) =>
      addr.title.toLowerCase().trim() ===
      decodeURIComponent(title).toLowerCase().trim(),
  );

  if (!existingAddress) {
    return res.status(404).json({ error: "Address not found" });
  }

  existingAddress.deliveryFee = deliveryFee;
  await myUser.save();

  logger.info(
    `Admin ${req.user._id} updated delivery fee for user ${id}, address ${existingAddress.title} to ${deliveryFee}`,
  );

  return res.status(200).json({
    message: "Delivery fee updated successfully",
    data: existingAddress,
  });
});

exports.toggleBlockUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const myUser = await User.findById(id);

  if (!myUser) return res.status(404).json({ error: "User not found" });

  myUser.isBlocked = !myUser.isBlocked;
  await myUser.save();

  logger.info(
    `Admin ${req.user._id} toggled block status for user ${id} to ${myUser.isBlocked}`,
  );
  return res.status(200).json({
    message: `User block status changed successfully`,
    isBlocked: myUser.isBlocked,
  });
});
