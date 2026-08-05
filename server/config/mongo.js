import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const CONNECTION_URL = process.env.MONGO_URI || "mongodb://localhost:27017/chat-web-v2";

mongoose.connect(CONNECTION_URL);

mongoose.connection.on("connected",() => {
  console.log("Arthur MongoDB connected successfully!");
});
mongoose.connection.on("reconnected",() => {
  console.log(" Arthur MongoDB Reconnected!");
});
mongoose.connection.on("error",(error) => {
  console.error(" Arthur MongoDB connection error:",error);
});
mongoose.connection.on("disconnected", () => {
  console.log(" Arthur MongoDB disconnected!");
});