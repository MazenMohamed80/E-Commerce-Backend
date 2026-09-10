const dotEnv = require("dotenv");
dotEnv.config();
const path = require("path");
const express = require("express");
const corsMiddleware = require("./middlewares/cors.middleware");
const app = express();
const port = process.env.PORT | 3000;
app.use(express.json());
app.use(corsMiddleware);
const { connectDB } = require("./config/db.config");
connectDB();
app.use("/api/v1/user", require("./routes/user.routes"));
app.use("/api/v1/auth", require("./routes/auth.route"));
app.use("/api/v1/product", require("./routes/product.route"));
app.use("/api/v1/cart", require("./routes/cart.route"));
app.use("/api/v1/order", require("./routes/order.route"));
app.use("/api/v1/testimonial", require("./routes/testimonial.route"));
app.use("/files", express.static(path.join(__dirname, "uploads")));
const AppError = require("./utils/appError.util");
app.use((req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl}`));
});
const globalError = require("./middlewares/errorHandler.middleware");
app.use(globalError);

app.listen(port, (_) => {
  console.log("link: http://localhost:3000");
});
