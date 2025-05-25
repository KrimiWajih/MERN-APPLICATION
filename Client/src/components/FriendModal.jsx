import axios from "axios";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function FriendModal({ user }) {
  const { UserInfo } = useSelector((state) => state.userdata);
  const [userData, setUserData] = useState(user);
  const [friendState, setFriendState] = useState("unfriend");

  useEffect(() => {
    setUserData(user);
    if (user.listFriends?.includes(UserInfo._id)) {
      setFriendState("unfriend");
    } else {
      setFriendState("not_friend");
    }
  }, [user, UserInfo._id]);

  const handleUnfriend = async () => {
    try {
      const response = await axios.post(
        `https://mern-application-w42i.onrender.com/unfriend`,
        { unfriendID: user._id },
        { withCredentials: true }
      );

      toast.success(response.data.Msg || "Unfriended successfully");
      setFriendState("not_friend");
      setUserData((prev) => ({
        ...prev,
        listFriends: prev.listFriends?.filter((id) => id !== UserInfo._id),
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.Msg || "Failed to unfriend the user"
      );
    }
  };

  return (
    <div>
      <div className="max-w-xs mx-auto mt-16 bg-white shadow-xl rounded-lg text-gray-900">
        <div className="rounded-t-lg h-32 overflow-hidden">
          <img
            className="object-cover object-top w-full"
            src={userData.coverpic}
            alt="Cover"
          />
        </div>
        <div className="mx-auto w-24 h-24 relative -mt-12 border-4 border-white rounded-full overflow-hidden">
          <img
            className="w-full h-full object-cover object-center"
            src={userData.profilepic}
            alt="Profile"
          />
        </div>
        <div className="text-center mt-2">
          <h2 className="font-semibold">{userData.name}</h2>
          <p className="text-gray-500">{userData.bio}</p>
        </div>
        <div className="p-4 border-t mx-8 mt-2">
          {friendState === "unfriend" ? (
            <button
              onClick={handleUnfriend}
              className="w-1/2 block mx-auto rounded-full bg-red-600 hover:bg-red-700 font-semibold text-white px-6 py-2"
            >
              Unfriend
            </button>
          ) : (
            <button
              disabled
              className="w-1/2 block mx-auto rounded-full bg-gray-400 font-semibold text-white px-6 py-2 cursor-not-allowed"
            >
              Not Friends
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
