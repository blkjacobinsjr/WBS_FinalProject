import mongoose from "mongoose";

const Schema = mongoose.Schema;

// SVG icons are stored as JSON objects
const iconSchema = new Schema({
  path: { type: String, required: true },
  fillRule: { type: String },
  clipRule: { type: String },
  strokeLinecap: { type: String },
  strokeLinejoin: { type: String },
});

const categorySchema = new Schema({
  // TODO: Not necessary for now, but we need this later
  // userId: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: iconSchema, required: true },
  selectable: { type: Boolean, default: true },
});

categorySchema.index({ name: 1 });

export default mongoose.model("Category", categorySchema);
