import axios from "axios";
import React from "react";
import { useDispatch} from "react-redux";

import { toast } from "react-toastify";
import { getRequests } from "../redux/UserSlice";

const NotificationMod = ({ user }) => {
console.log(user)
  const dispatch = useDispatch();

  const handleAccept = async () => {
   const response = await axios.post ("https://mern-application-w42i.onrender.com/addfriend",{response :"accept" , friendreqID : user._id },{withCredentials : true})
    console.log("Accepted:", response);
    toast.info("Friend request accepted!");
    dispatch(getRequests());
  };

  const handleReject = async () => {
    const response = await axios.post ("https://mern-application-w42i.onrender.com/addfriend",{response :"reject" , friendreqID : user._id },{withCredentials : true})
     console.log("Rejected:", response);
     toast.info("Friend request rejected!");
    dispatch(getRequests());
   };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-4">
        <img
          src={user.senderId.profilepic || "/path/to/default-profile-pic.jpg"}
          alt={user.senderId.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h2 className="text-lg font-medium text-gray-700">{user.senderId.name}</h2>
          <p className="text-sm text-gray-500">{user.senderId.bio || "No bio available"}</p>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          className="bg-blue-600 text-white py-2 px-6 rounded-lg transition hover:bg-blue-700"
          onClick={handleAccept}
        >
          Accept
        </button>
        <button
          className="bg-red-600 text-white py-2 px-6 rounded-lg transition hover:bg-red-700"
          onClick={handleReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default NotificationMod;
