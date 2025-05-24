const socket = require('socket.io');
const Message = require('./models/MessageSchema');
const Conversation = require('./models/Conversation');

const findOrCreate = async (senderID, recieverID) => {
  const participants = [senderID, recieverID].sort(); // sorting ensures same order
  let conversation = await Conversation.findOne({ participants });

  if (!conversation) {
    conversation = new Conversation({ participants });
    await conversation.save();
  }

  return conversation;
};

const initialization = (server) => {
  const io = new socket.Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://localhost:5173',
        'https://a55e-197-2-85-89.ngrok-free.app',
        'https://mern-application-1-fozj.onrender.com'
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('setuser', (id) => {
      socket.join(id);
      console.log(`User ${id} joined their room`);
    });

    socket.on('sendmessage', async (data) => {
      const { senderID, recieverID, text } = data;
      const conversation = await findOrCreate(senderID, recieverID);

      const newmessage = new Message({
        text,
        senderID,
        recieverID,
        conversationID: conversation._id,
      });
      await newmessage.save();

      // Emit to both sender and receiver
      io.to(senderID).to(recieverID).emit('receivemessage', { ...newmessage._doc });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = initialization;
