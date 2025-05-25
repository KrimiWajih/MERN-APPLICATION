import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getPosts, getComments } from "../redux/UserSlice";
import PostUser from "./PostUser";
import Comment from "./Comment";
import axios from "axios";
import { toast } from "react-toastify";
import { Image, Edit } from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const { UserInfo, Posts, Comments, Loading } = useSelector((state) => state.userdata);
  const [activeTab, setActiveTab] = useState("posts");
  const [comments, setComments] = useState([]);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPicFile, setCoverPicFile] = useState(null);
  const [bio, setBio] = useState(""); // State for bio input
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  // Sync local comments state with Redux Comments state
  useEffect(() => {
    setComments(Comments || []);
    console.log("Synced Redux Comments:", Comments);
  }, [Comments]);

  // Fetch initial data and set bio
  useEffect(() => {
 
    dispatch(getPosts());
    if (UserInfo?._id) {
      dispatch(getComments(UserInfo._id));
    }
    if (UserInfo?.bio) {
      setBio(UserInfo.bio); // Initialize bio with current value
    }
  }, [dispatch, UserInfo]);

  // Handle profile picture change
  const handleProfilePicChange = (e) => {
    setProfilePicFile(e.target.files[0]);
  };

  // Handle cover picture change
  const handleCoverPicChange = (e) => {
    setCoverPicFile(e.target.files[0]);
  };

  // Handle profile, cover picture, and/or bio update
  const handleProfileUpdate = async () => {
    if (!profilePicFile && !coverPicFile && !bio.trim()) {
      toast.error("Please provide at least one update (image or bio)");
      return;
    }

    try {
      const uploadPromises = [];
      const payload = { bio }; // Include bio in payload

      // Upload profile picture to Cloudinary if provided
      if (profilePicFile) {
        const formData = new FormData();
        formData.append("upload_preset", "krimiwa");
        formData.append("file", profilePicFile);
        uploadPromises.push(
          axios
            .post("https://api.cloudinary.com/v1_1/dliy8blry/upload", formData)
            .then((res) => {
              payload.profilepic = res.data.secure_url;
              console.log("Cloudinary profile pic URL:", payload.profilepic);
            })
        );
      }

      // Upload cover picture to Cloudinary if provided
      if (coverPicFile) {
        const formData = new FormData();
        formData.append("upload_preset", "krimiwa");
        formData.append("file", coverPicFile);
        uploadPromises.push(
          axios
            .post("https://api.cloudinary.com/v1_1/dliy8blry/upload", formData)
            .then((res) => {
              payload.coverpic = res.data.secure_url;
              console.log("Cloudinary cover pic URL:", payload.coverpic);
            })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Send to backend
      const response = await axios.post(
        "https://mern-application-w42i.onrender.com/editprofile",
        payload,
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      console.log("Profile update response:", response.data);

      // Refresh UserInfo
      await dispatch(getCurrent());
      toast.success("Profile updated!");

      // Clear inputs
      setProfilePicFile(null);
      setCoverPicFile(null);
      if (profilePicRef.current) profilePicRef.current.value = "";
      if (coverPicRef.current) coverPicRef.current.value = "";
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      toast.error(error.response?.data?.Msg || "Failed to update profile");
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postID) => {
    try {
      await axios.delete(`https://mern-application-w42i.onrender.com/deletepost/${postID}`, {
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
      userID:
        newComment.userID._id === UserInfo._id || newComment.userID === UserInfo._id
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
          {/* Cover picture container */}
          <div
            className="w-full h-48 bg-gray-200 relative"
            style={{
              backgroundImage: `url(${
                UserInfo.coverpic || "https://via.placeholder.com/1200x300"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Profile picture positioned over cover picture */}
            <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
              <img
                src={UserInfo.profilepic || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
          </div>
          {/* User info below cover and profile pictures */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{UserInfo.username}</h2>
            <p className="text-gray-600 mt-2">{UserInfo.bio || "No bio yet"}</p>
          </div>
          {/* Profile, cover picture, and bio update */}
          <div className="mt-4 flex flex-col items-center w-full max-w-md">
            <div className="flex space-x-4 mb-4">
              {/* Profile picture upload */}
              <div className="flex flex-col items-center">
                <label
                  htmlFor="profile-pic-upload"
                  className="flex items-center cursor-pointer mb-2"
                >
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
              </div>
              {/* Cover picture upload */}
              <div className="flex flex-col items-center">
                <label
                  htmlFor="cover-pic-upload"
                  className="flex items-center cursor-pointer mb-2"
                >
                  <Image className="w-6 h-6 text-indigo-500 mr-2" />
                  <span className="text-gray-600">Change Cover Picture</span>
                </label>
                <input
                  id="cover-pic-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPicChange}
                  ref={coverPicRef}
                  className="hidden"
                />
              </div>
            </div>
            {/* Bio edit */}
            <div className="w-full mb-4">
              <label className="flex items-center mb-2">
                <Edit className="w-6 h-6 text-indigo-500 mr-2" />
                <span className="text-gray-600">Edit Bio</span>
              </label>
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Write a short bio (max 160 characters)"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                maxLength={160}
              ></textarea>
            </div>
            {(profilePicFile || coverPicFile || bio.trim()) && (
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Save Changes
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
