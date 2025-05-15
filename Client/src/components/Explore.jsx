import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConnect, getFollow } from '../redux/UserSlice'; // import the correct thunks
import ConnectModal from './ConnectModal'; 
import FollowModal from './FollowModal';


export default function Explore() {
  const dispatch = useDispatch();
  const { UserConnect, UserFollow, Loading } = useSelector((state) => state.userdata);

  useEffect(() => {
    dispatch(getConnect());
    dispatch(getFollow());
  }, [dispatch]);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {Loading ? (
        <h1>Loading...</h1>
      ) : UserConnect.length !== 0 ? (
        UserConnect.map((user) => (
          <ConnectModal key={user._id} user={user} />
        ))
      ) : (
        <h1>No users to connect with</h1>
      )}

      {UserFollow.length !== 0 && (
        <div className="mt-8 w-full">
          <h2 className="text-2xl font-bold text-center mb-4">Users to Follow</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {UserFollow.map((user) => (
              <FollowModal key={user._id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
