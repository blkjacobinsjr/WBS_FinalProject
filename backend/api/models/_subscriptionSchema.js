import mongoose from "mongoose";
import Category from "./_categorySchema.js";

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    interval: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: Category,
      default: "65085704f18207c1481e6642", // Category "None"
    },
    billing_date: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subscriptionSchema.index({ userId: 1, createdAt: -1 });
subscriptionSchema.index({ userId: 1, category: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
