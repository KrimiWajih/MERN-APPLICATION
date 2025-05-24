const Users = require("../models/UsersSchema");
const Messages = require("../models/MessageSchema");
const Conversation = require("../models/Conversation");

exports.getMessage = async (req, res) => {
  const { senderID, recieverID } = req.params;

  try {
    // Find conversation regardless of participant order
    const conversation = await Conversation.findOne({
      participants: { $all: [senderID, recieverID] },
    });

    if (!conversation) {
      return res.status(200).send({ messages: [] });
    }

    // Get all messages in that conversation
    const messages = await Messages.find({
      conversationID: conversation._id,
    }).sort({ createdAt: 1 }); // oldest to newest

    return res.status(200).send({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).send({ messages: "Error getting messages" });
  }
};
