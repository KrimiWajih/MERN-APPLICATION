import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFriends } from '../redux/UserSlice';
import FriendModal from './FriendModal';

export default function Friends() {
  const dispatch = useDispatch();
  const { Friends, Loading } = useSelector((state) => state.userdata);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Fetch friends on mount
  useEffect(() => {
    dispatch(getFriends());
  }, [dispatch]);

  // Handle friend click to open modal
  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedFriend(null);
  };

  if (Loading) {
    return <div className="text-center py-10">Loading friends...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Friends</h1>
      {Friends?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Friends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              onClick={() => handleFriendClick(friend)}
            >
              <img
                src={friend.profilepic || '/default-avatar.png'}
                alt={`${friend.username || 'Friend'} avatar`}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {friend.username || friend.name || 'Unknown'}
                </p>
                {friend.bio && (
                  <p className="text-sm text-gray-600 truncate">{friend.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No friends to display.</p>
      )}

      {selectedFriend && (
        <FriendModal user={selectedFriend} onClose={handleCloseModal} />
      )}
    </div>
  );
}