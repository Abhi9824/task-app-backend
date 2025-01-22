const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  ],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  teams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],

  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = { User };
