import React, { useEffect, useState, useRef } from "react";
import { Image } from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getFPosts } from "../redux/UserSlice";
import { toast } from "react-toastify";

const PostModal = ({ isOpen, onClose }) => {
  const [postText, setPostText] = useState("");
  const [images, setImages] = useState([]); // Array for multiple images
  const { UserInfo } = useSelector((state) => state.userdata);
  const dispatch = useDispatch();
  const imageRef = useRef(null);

  useEffect(() => {
    dispatch(getCurrent()); // Fetch current user info
  }, [dispatch]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files)); // Store multiple files
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && images.length === 0) {
      toast.error("Post content or at least one image is required");
      return;
    }

    if (!UserInfo?._id) {
      toast.error("Please log in to post");
      return;
    }

    try {
      const imageLinks = [];
      if (images.length > 0) {
        for (const img of images) {
          const formData = new FormData();
          formData.append("upload_preset", "krimiwa");
          formData.append("file", img);
          const res = await axios.post(
            "https://api.cloudinary.com/v1_1/dliy8blry/upload",
            formData
          );
          if (typeof res.data.secure_url !== "string") {
            throw new Error("Invalid Cloudinary URL");
          }
          imageLinks.push(res.data.secure_url);
        }
        console.log("Cloudinary image URLs:", imageLinks);
      }

      const postData = {
        content: postText,
        userID: UserInfo._id,
        media: imageLinks,
      };

      const response = await axios.post("https://mern-application-w42i.onrender.com/addpost", postData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      console.log("Post submitted:", response.data);
      toast.success("Post created successfully!");

      setPostText("");
      setImages([]);
      if (imageRef.current) imageRef.current.value = "";
      dispatch(getFPosts()); // Refresh posts
      onClose();
    } catch (error) {
      console.error("Error submitting post:", error.response?.data || error.message);
      toast.error(error.response?.data?.Msg || "Failed to create post");
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
        <div className="bg-white p-6 rounded-xl shadow-md">
          <textarea
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows="4"
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          ></textarea>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Image Upload and Post Buttons */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="image-upload"
              className="flex items-center cursor-pointer"
            >
              <Image className="w-6 h-6 text-indigo-500" />
              <span className="ml-2 text-gray-600">Upload Images</span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple // Enable multiple file selection
              onChange={handleImageChange}
              ref={imageRef}
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
