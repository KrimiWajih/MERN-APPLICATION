import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getPosts, getComments } from "../redux/UserSlice";
import PostUser from "./PostUser";
import Comment from "./Comment";
import axios from "axios";
import { toast } from "react-toastify";
import { Image } from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const { UserInfo, Posts, Comments, Loading } = useSelector((state) => state.userdata);
  const [activeTab, setActiveTab] = useState("posts");
  const [comments, setComments] = useState([]);
  const [profilePicFile, setProfilePicFile] = useState(null); // New state for file
  const profilePicRef = useRef(null); // Ref to clear input

  // Sync local comments state with Redux Comments state
  useEffect(() => {
    setComments(Comments || []);
    console.log("Synced Redux Comments:", Comments);
  }, [Comments]);

  // Fetch initial data
  useEffect(() => {
    dispatch(getCurrent());
    dispatch(getPosts());
    if (UserInfo?._id) {
      dispatch(getComments(UserInfo._id));
    }
  }, [dispatch, UserInfo?._id]);

  // Handle profile picture change
  const handleProfilePicChange = (e) => {
    setProfilePicFile(e.target.files[0]);
  };

  // Handle profile picture upload
  const handleProfilePicUpload = async () => {
    if (!profilePicFile) {
      toast.error("Please select an image");
      return;
    }

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("upload_preset", "krimiwa");
      formData.append("file", profilePicFile);
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dliy8blry/upload",
        formData
      );
      const profilePicUrl = res.data.secure_url;
      console.log("Cloudinary profile pic URL:", profilePicUrl);

      // Send to backend
      const response = await axios.post(
        "/api/editprofile",
        { profilepic: profilePicUrl },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      console.log("Profile update response:", response.data);

      // Refresh UserInfo
      await dispatch(getCurrent());
      toast.success("Profile picture updated!");

      // Clear input
      setProfilePicFile(null);
      if (profilePicRef.current) profilePicRef.current.value = "";
    } catch (error) {
      console.error("Error updating profile picture:", error.response?.data || error.message);
      toast.error(error.response?.data?.Msg || "Failed to update profile picture");
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postID) => {
    try {
      await axios.delete(`/api/deletepost/${postID}`, {
        withCredentials: true,
      });
      dispatch(getPosts());
      toast.success("Post deleted!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  // Handle comment deletion
  const handleDeleteComment = (commentID) => {
    const previousComments = [...comments];
    const updateComments = (comments) =>
      comments
        .filter((comment) => comment._id !== commentID)
        .map((comment) => ({
          ...comment,
          replies: comment.replies ? updateComments(comment.replies) : [],
        }));
    setComments((prev) => {
      const updated = updateComments(prev);
      console.log("Comments after delete:", updated);
      return updated;
    });

    dispatch(getComments(UserInfo._id)).then((action) => {
      if (action.meta.requestStatus === "rejected") {
        console.error("Refetch failed:", action.error);
        toast.error(action.error.message || "Failed to refresh comments");
        setComments(previousComments);
      }
    });
  };

  // Handle adding a new comment/reply
  const handleAddComment = (newComment) => {
    const enhancedComment = {
      ...newComment,
      userID: newComment.userID._id === UserInfo._id || newComment.userID === UserInfo._id
        ? {
            _id: UserInfo._id,
            name: UserInfo.name,
            username: UserInfo.username,
            profilepic: UserInfo.profilepic,
          }
        : newComment.userID,
    };

    setComments((prev) => {
      if (newComment.parentCommentID) {
        return prev.map((comment) =>
          comment._id === newComment.parentCommentID
            ? {
                ...comment,
                replies: [...(comment.replies || []), enhancedComment],
              }
            : comment
        );
      }
      return [enhancedComment, ...prev];
    });
    dispatch(getComments(UserInfo._id));
  };

  // Handle comment click
  const handleCommentClick = (commentID) => {
    console.log("Comment clicked:", commentID);
  };

  if (Loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <h1 className="text-3xl font-semibold text-center mb-6">User Profile</h1>

      {/* Display user info */}
      {UserInfo && (
        <div className="flex flex-col items-center mb-8 border-b border-gray-300 pb-6">
          <img
            src={UserInfo.profilepic || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-indigo-500 shadow-md"
          />
          <h2 className="text-2xl font-bold text-gray-900">{UserInfo.username}</h2>
          <p className="text-gray-600 mt-2 text-center">{UserInfo.bio}</p>
          {/* Profile picture upload */}
          <div className="mt-4 flex flex-col items-center">
            <label htmlFor="profile-pic-upload" className="flex items-center cursor-pointer mb-2">
              <Image className="w-6 h-6 text-indigo-500 mr-2" />
              <span className="text-gray-600">Change Profile Picture</span>
            </label>
            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              ref={profilePicRef}
              className="hidden"
            />
            {profilePicFile && (
              <button
                onClick={handleProfilePicUpload}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Upload Profile Picture
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 mx-2 rounded-lg font-semibold ${
            activeTab === "posts"
              ? "bg-indigo-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button
          className={`px-4 py-2 mx-2 rounded-lg font-semibold ${
            activeTab === "comments"
              ? "bg-indigo-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("comments")}
        >
          Comments
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="space-y-6">
        {activeTab === "posts" && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Posts</h2>
            {Posts?.length > 0 ? (
              Posts.map((post) => (
                <div
                  key={post._id}
                  className="p-4 rounded-xl shadow-md border border-gray-200 hover:bg-gray-100 transition"
                >
                  <PostUser
                    post={post}
                    postID={post._id}
                    onDelete={handleDeletePost}
                    onLike={() => console.log("Like clicked")}
                    onMessage={() => console.log("Message clicked")}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500">No posts to display.</p>
            )}
          </>
        )}

        {activeTab === "comments" && (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Comments</h2>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className="p-4 rounded-xl shadow-md border border-gray-200 mb-4"
                >
                  <Comment
                    comment={comment}
                    postId={comment.postID?._id}
                    onAddComment={handleAddComment}
                    onCommentClick={handleCommentClick}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500">No comments to display.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;