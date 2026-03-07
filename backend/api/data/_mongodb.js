import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectionString = process.env.MONGODB_URI;
const db = mongoose.connection;
let connectionPromise = null;

export async function connectToDatabase() {
  if (db.readyState === 1) {
    return db;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(connectionString)
      .then(() => {
        console.info("MongoDB connected");
        return db;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

db.on("error", console.error.bind(console, "MongoDB connection error:"));

export default db;
