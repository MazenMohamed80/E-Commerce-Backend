const cors = require("cors");

const configuredOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.ALLOWED_ORIGIN ||
  "http://localhost:4200"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOption = {
  origin: function (origin, cb) {

    if (!origin) {
      return cb(null, true);
    }

    if (configuredOrigins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error("Origin Policy: Origin Not Allowed!"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = cors(corsOption);
