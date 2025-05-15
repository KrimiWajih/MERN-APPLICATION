import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getFPosts, getFollowPosts } from "../redux/UserSlice";
import { Image } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import PostUser from "./PostUser";

const Home = () => {
  const dispatch = useDispatch();
  const { UserInfo, FPosts, FollowPosts, Loading } = useSelector((state) => state.userdata);
  const [postText, setPostText] = useState("");
  const [images, setImages] = useState([]); // Array for multiple images
  const [activeTab, setActiveTab] = useState("friends");
  const imageRef = useRef(null);

  useEffect(() => {
    dispatch(getCurrent());
    dispatch(getFPosts());
    dispatch(getFollowPosts());
  }, [dispatch]);

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
      console.log("postData before sending:", JSON.stringify(postData, null, 2));

      const response = await axios.post("/api/addpost", postData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      console.log("Post submitted:", response.data);
      toast.success("Post created successfully!");

      setPostText("");
      setImages([]);
      if (imageRef.current) imageRef.current.value = "";

      dispatch(getFPosts());
      dispatch(getFollowPosts());
    } catch (error) {
      console.error("Error submitting post:", error.response?.data || error.message);
      toast.error(error.response?.data?.Msg || "Failed to create post");
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <h1 className="text-3xl font-semibold mb-4">Home</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Welcome {UserInfo?.name || "Guest"}
        </h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8 w-full">
        <textarea
          className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows="4"
          placeholder="What's on your mind?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        ></textarea>

        <div className="flex items-center justify-between">
          <label htmlFor="image-upload" className="flex items-center cursor-pointer">
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

      <div className="flex justify-center mb-6">
        <button
          className={`px-4 py-2 mx-2 rounded-lg font-semibold ${
            activeTab === "friends"
              ? "bg-indigo-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Friends' Posts
        </button>
        <button
          className={`px-4 py-2 mx-2 rounded-lg font-semibold ${
            activeTab === "followed"
              ? "bg-indigo-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("followed")}
        >
          Followed Posts
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 w-full">
          {activeTab === "friends" ? "Friends' Posts" : "Followed Posts"}
        </h2>
        {Loading ? (
          <p>Loading...</p>
        ) : activeTab === "friends" ? (
          FPosts?.length === 0 ? (
            <p>No posts from friends</p>
          ) : (
            FPosts?.map((post) => (
              <PostUser key={post._id} post={post} postID={post._id} />
            ))
          )
        ) : FollowPosts?.length === 0 ? (
          <p>No posts from followed users</p>
        ) : (
          FollowPosts?.map((post) => (
            <PostUser key={post._id} post={post} postID={post._id} />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;