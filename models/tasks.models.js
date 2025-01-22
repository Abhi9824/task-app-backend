const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  owners: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  // tags: [{ type: String }], // Array of tags
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
    },
  ],
  timeToComplete: { type: Number, required: true },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Completed", "Blocked", "Closed"], // Enum for task status
    default: "To Do",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update the `updatedAt` field whenever the document is updated
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = { Task };
