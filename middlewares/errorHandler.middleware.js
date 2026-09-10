const logger = require("../utils/logger.util");

module.exports = (err, req, res, next) => {
  if (err?.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue || {})[0] || "value";
    const duplicatedValue = err.keyValue?.[duplicatedField];

    err.statusCode = 409;
    err.status = "fail";
    err.isOperational = true;

    if (duplicatedField === "slug") {
      err.message = `A product with slug "${duplicatedValue}" already exists.`;
    } else {
      err.message = `A record with this ${duplicatedField} already exists.`;
    }
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(
    `Error found | ${err.statusCode} |${req.method} ${req.originalUrl} | ${err.message} `,
    {
      stack: err.stack,
    },
  );

  if (process.env.NODE_ENV === "dev") {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      return res.status(500).json({
        status: "error",
        message: "Something went worng",
      });
    }
  }
};
