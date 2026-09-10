const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const token = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
    },
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const myUser = await User.findOne({ email: email });
  if (!myUser || !(await myUser.isCorrectPass(password))) {
    return res.status(404).json({ error: "Invalid email or password" });
  }
  if (myUser.isBlocked) {
    return res
      .status(403)
      .json({
        error:
          "Your account has been blocked. Please contact the administrator.",
      });
  }

  const accessToken = token(myUser);
  res.status(200).json({ message: "Logged in ", token, accessToken });
};
