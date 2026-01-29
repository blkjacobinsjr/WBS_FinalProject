import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectionString = process.env.MONGODB_URI;

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.info("MongoDB connected"))
  .catch((error) => console.error(error));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

export default db;
