import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invites: [
    {
      email: String,
      inviteToken: String,
      isAccepted: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Room", roomSchema);
