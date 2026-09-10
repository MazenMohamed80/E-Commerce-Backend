const multer = require("multer");
const path = require("path");
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".png", ".jpg", ".jpeg"];
  if (!allowed.includes(ext)) {
    return cb(new Error("Only images are allowed"), false);
  }
  return cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const MBLimit = 1024 * 1024 * 5;
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MBLimit },
});

module.exports = upload;
