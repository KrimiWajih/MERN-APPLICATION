import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { getFriends } from '../redux/UserSlice';
import './Messages.css';

const apiUrl = '/api'; // Use Vite proxy
const socket = io({
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  path: '/socket.io',
});

export default function Messages() {
  const { UserInfo, Friends } = useSelector((state) => state.userdata);
  const [reciever, setReciever] = useState(null);
  const [messageList, setMessageList] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread messages per friend
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!UserInfo || !UserInfo._id) {
      console.log('No UserInfo, redirecting to /');
      navigate('/messages');
    } else {
      console.log('Fetching friends for UserInfo:', UserInfo._id);
      dispatch(getFriends());
    }
  }, [UserInfo, navigate, dispatch]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message, error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    if (UserInfo?._id) {
      console.log('Joining socket room for user:', UserInfo._id);
      socket.emit('setuser', UserInfo._id);
    }
  }, [UserInfo]);

  const getMessages = async () => {
    if (!UserInfo?._id || !reciever) {
      console.warn('Cannot fetch messages: missing UserInfo._id or reciever', {
        UserInfo_id: UserInfo?._id,
        reciever,
      });
      return;
    }

    try {
      console.log('Fetching messages for:', UserInfo._id, reciever);
      const response = await axios.get(
        `${apiUrl}message/${UserInfo._id}/${reciever}`,
        { withCredentials: true }
      );
      console.log('Messages fetched:', response.data);
      setMessageList(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (UserInfo?._id && reciever) {
      getMessages();
      // Reset unread count for the selected receiver
      setUnreadCounts((prev) => ({
        ...prev,
        [reciever]: 0,
      }));
    }
  }, [reciever, UserInfo]);

  useEffect(() => {
    socket.on('receivemessage', (message) => {
      console.log('Received message:', message);
      console.log('Current reciever:', reciever, 'UserInfo._id:', UserInfo?._id);
      if (
        (message.senderID === reciever &&
          message.recieverID === UserInfo?._id) ||
        (message.senderID === UserInfo?._id &&
          message.recieverID === reciever)
      ) {
        console.log('Adding message to list:', message);
        setMessageList((prev) => [...prev, message]);
      } else if (message.recieverID === UserInfo?._id) {
        // Increment unread count for messages from other users
        setUnreadCounts((prev) => ({
          ...prev,
          [message.senderID]: (prev[message.senderID] || 0) + 1,
        }));
      } else {
        console.log('Message not added: IDs do not match', {
          messageSender: message.senderID,
          messageReceiver: message.recieverID,
          currentReciever: reciever,
          currentUser: UserInfo?._id,
        });
      }
    });

    return () => {
      socket.off('receivemessage');
    };
  }, [reciever, UserInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const handleSubmit = async () => {
    if (newMessage.trim() && reciever) {
      const message = {
        senderID: UserInfo._id,
        recieverID: reciever,
        text: newMessage,
      };
      try {
        console.log('Sending message:', message);
        socket.emit('sendmessage', message);
        const response = await axios.post(`${apiUrl}message/`, message, {
          withCredentials: true,
        });
        console.log('Message saved:', response.data);
        setMessageList((prev) => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to save message:', error.response?.data || error.message);
      }
    } else {
      console.warn('Cannot send message: missing reciever or empty message', {
        reciever,
        newMessage,
      });
    }
  };

  return (
    <div className="Messages-container">
      <div className="Messages-friends-list">
        {UserInfo &&
          Friends.filter((el) => el._id !== UserInfo._id).map((el) => (
            <div
              key={el._id}
              className={`friend-item ${reciever === el._id ? 'selected' : ''}`}
              onClick={() => {
                console.log('Selected reciever:', el._id);
                setReciever(el._id);
              }}
            >
              <div className="friend-item-image-container">
                <img
                  src={el.profilepic}
                  alt={el.name}
                  referrerPolicy="no-referrer"
                />
                {unreadCounts[el._id] > 0 && (
                  <span className="unread-badge">{unreadCounts[el._id]}</span>
                )}
              </div>
              <p>{el.name}</p>
            </div>
          ))}
      </div>

      <div className="Messages-chat-section">
        <div className="messages-list">
          {reciever ? (
            messageList && messageList.length > 0 ? (
              messageList.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.senderID === UserInfo?._id ? 'sent' : 'received'}`}
                >
                  <div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-messages">No messages yet.</p>
            )
          ) : (
            <p className="no-messages">Select a friend to start chatting.</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={handleSubmit}
            disabled={!newMessage.trim() || !reciever}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}