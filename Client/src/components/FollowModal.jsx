import axios from "axios";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function Connect({ user }) {
  const { UserInfo } = useSelector((state) => state.userdata);
  const [userData, setUserData] = useState(user);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setUserData(user);
    if (user.followers?.includes(UserInfo._id) ) {
      setIsFollowing(true);
    } else {
      setIsFollowing(false);
    }
  }, [user, UserInfo._id]);

  const handleFollow = async () => {
    try {
      const response = await axios.post(
        `/api/follow`,
        { followedID: user._id },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      setIsFollowing(true);
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Error occurred");
      } else {
        toast.error("Server not reachable");
      }
    }
  };

  return (
    <div>
      <div className="max-w-xs mx-auto mt-16 bg-white shadow-xl rounded-lg text-gray-900">
        <div className="rounded-t-lg h-24 overflow-hidden">
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
          <h2 className="font-semibold text-sm">{userData.name}</h2>
          <p className="text-gray-500 text-xs">{userData.bio}</p>
        </div>
        <ul className="py-4 mt-2 text-gray-700 flex items-center justify-around">
          {/* You can show stats here */}
        </ul>
        <div className="p-4 border-t mx-8 mt-2">
          <button
            onClick={handleFollow}
            disabled={isFollowing}
            className={`w-1/2 block mx-auto rounded-full ${
              isFollowing ? "bg-gray-400" : "bg-gray-900"
            } hover:shadow-lg font-semibold text-white px-6 py-2`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
}