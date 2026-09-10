const mongoose = require("mongoose");
exports.connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.DB_STRING);
    console.log(`database Connected: ${connection.connection.host}`);
  } catch (err) {
    console.log({ message: err.message });
    process.exit(1);
  }
};
