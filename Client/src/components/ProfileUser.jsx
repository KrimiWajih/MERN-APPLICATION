import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getComments, getCurrent, getPosts } from "../redux/UserSlice";
import PostUser from "./PostUser";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ProfileUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userID } = useParams();
  const { UserInfo } = useSelector((state) => state.userdata); // Current user

  const [User, setUser] = useState(null); // Profile user
  const [Posts, setPosts] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendState, setFriendState] = useState("not_friend");



 
  useEffect(() => {
    if (!UserInfo || !userID) return;

    if (userID === UserInfo._id) {
      navigate("/profile", { replace: true });
      return;
    }


    const fetchUserAndPosts = async () => {
      try {
        
        const [userRes, postsRes] = await Promise.all([
     
          axios.get(`/api/users/${userID}`, { withCredentials: true }),
          axios.get(`/api/userposts/${userID}`, { withCredentials: true }),
        ]);

        const profileUser = userRes.data.User;
        setUser(profileUser);
        setPosts(postsRes.data.Post);

        // Check follow/friend status
        setIsFollowing(profileUser.followers?.includes(UserInfo._id));
        setFriendState(
          profileUser.listFriends?.includes(UserInfo._id)
            ? "unfriend"
            : "not_friend"
        );
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPosts();

    // Fetch related data
    dispatch(getPosts());
    dispatch(getComments(UserInfo._id));
  }, [UserInfo, userID, dispatch, navigate]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      const response = await axios.post(
        `/api/follow`,
        { followedID: userID },
        { withCredentials: true }
      );
      const { Msg, Res } = response.data;
      toast.success(Msg);
      setIsFollowing(Res === "follow");
    } catch (error) {
      toast.error(error.response?.data?.Msg || "Failed to update follow status");
    }
  };

  // Handle friend request/unfriend
  const handleFriendAction = async () => {
    try {
      if (friendState === "not_friend") {
        await axios.post(
          "/api/friendrequest",
          { receiverId: userID },
          { withCredentials: true }
        );
        toast.success("Friend request sent");
      } else if (friendState === "unfriend") {
        await axios.post(
          "/api/unfriend",
          { unfriendID: userID },
          { withCredentials: true }
        );
        setFriendState("not_friend");
        setUser((prev) => ({
          ...prev,
          listFriends: prev.listFriends?.filter((id) => id !== UserInfo?._id),
        }));
        toast.success("Unfriended successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.Msg || "Failed to update friend status");
    }
  };

  if (Loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <h1 className="text-3xl font-semibold text-center mb-6">User Profile</h1>

      {User && (
        <div className="flex flex-col items-center mb-8 border-b border-gray-300 pb-6">
          <img
            src={User.profilepic || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-indigo-500 shadow-md"
          />
          <h2 className="text-2xl font-bold text-gray-900">{User.username}</h2>
          <p className="text-gray-600 mt-2 text-center">{User.bio}</p>

          {UserInfo?._id !== userID && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  isFollowing
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-900 text-white hover:shadow-lg"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
              <button
                onClick={handleFriendAction}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  friendState === "unfriend"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {friendState === "unfriend" ? "Unfriend" : "Add Friend"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Posts</h2>
        { Posts && Posts.length > 0 ? (
          Posts.map((post) => (
            <div
              key={post._id}
              className="p-4 rounded-xl shadow-md border border-gray-200 hover:bg-gray-100 transition"
            >
              <PostUser
                post={post}
                postID={post._id}
                onLike={() => console.log("Like clicked")}
                onMessage={() => console.log("Message clicked")}
              />
            </div>
          ))
        ) : (
          <p className="text-gray-500">No posts to display.</p>
        )}
      </div>
    </div>
  );
};

export default ProfileUser;
