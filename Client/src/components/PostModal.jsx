import React, { useEffect, useState } from "react";
import { Image } from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getFPosts } from "../redux/UserSlice";

const PostModal = ({ isOpen, onClose }) => {
  const [postText, setPostText] = useState("");
  const [image, setImage] = useState(null);
  const { UserInfo, FPosts, Loading } = useSelector((state) => state.userdata);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrent()); // Fetch current user info
    dispatch(getFPosts()); // Fetch friends' posts
  }, [dispatch]);

  if (!isOpen) return null; // Don't render the modal if it's closed

  const handlePostSubmit = async () => {
    const postData = {
      content: postText,
      userID: UserInfo?._id, // Assuming UserInfo contains user ID
    };

    // If there's an image, append it to the form data
    if (image) {
      const formData = new FormData();
      formData.append("content", postText);
      formData.append("userID", UserInfo?._id);
      formData.append("image", image); // Add the image to form data

      try {
        const response = await axios.post(
          "api/addpost",
          formData,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );
   
        console.log("Post submitted:", response.data);
        setPostText(""); // Reset the post text area
        setImage(null); // Reset the image after posting
        onClose(); // Close the modal after post
      } catch (error) {
        console.error("Error submitting post:", error);
      }
    } else {
      try {
        const response = await axios.post(
          "api/addpost",
          postData,
          { withCredentials: true }
        );
        console.log("Post submitted:", response.data);
        setPostText(""); // Reset the post text area
        onClose(); // Close the modal after post
      } catch (error) {
        console.error("Error submitting post:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center min-h-screen z-[100]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Create Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {/* Post Content */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <textarea
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="4"
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          ></textarea>

          {/* Image Preview */}
          {image && (
            <div className="mb-4">
              <img
                src={URL.createObjectURL(image)}
                alt="Post Preview"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          {/* Image Upload and Post Buttons */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="image-upload"
              className="flex items-center cursor-pointer"
            >
              <Image className="w-6 h-6 text-indigo-500" />
              <span className="ml-2 text-gray-600">Upload Image</span>
            </label>
            <input
              id="image-upload"
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              className="hidden"
            />

            <button
              onClick={handlePostSubmit}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;