import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRequests } from "../redux/UserSlice";
import NotificationMod from "./NotificationMod";

const Notification = () => {
  const dispatch = useDispatch();
  const { FriendRequests, Loading, error } = useSelector(
    (state) => state.userdata
  );

  useEffect(() => {
    dispatch(getRequests());
  }, [dispatch]);

  if (Loading) return <div className="text-center text-lg">Loading...</div>;

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container flex flex-col">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Notifications</h1>
      {(!FriendRequests || FriendRequests.length === 0) ? (
  <p className="text-center text-gray-500">No friend requests found.</p>
) : (
  <div className="space-y-6">
    {FriendRequests.map((request) => (
      <NotificationMod key={request._id} user={request} />
    ))}
  </div>
)}

    </div>
  );
};

export default Notification;
