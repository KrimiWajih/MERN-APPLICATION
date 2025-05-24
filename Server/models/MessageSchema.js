const mongoose = require("mongoose");
const MessageSchema = mongoose.Schema({
  text: { type: String, required: true },
  senderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recieverID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  date: { type: Date, default: Date.now() },

  conversationID: { type: mongoose.Schema.Types.ObjectId, ref: "Conversations"  },
},{ timestamps: true });

MessageSchema.index({conversationID : 1})
const Collection = mongoose.model("Messages", MessageSchema);
module.exports = Collection;
