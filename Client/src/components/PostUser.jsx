import React, { useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, X } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Comment from "./Comment";

const PostUser = ({ post, postID, onDelete }) => {
  const { UserInfo } = useSelector((state) => state.userdata);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(
    UserInfo?._id ? post.listUsers?.includes(UserInfo._id) : false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comments, setComments] = useState([]);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/comments/${post._id}`, {
          withCredentials: true,
        });
        console.log("Fetched comments:", response.data.comments);
        setComments(response.data.comments || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error(error.response?.data?.Msg || "Failed to load comments");
      }
    };
    fetchComments();
  }, [post._id]);

  const handleLike = async () => {
    if (!UserInfo?._id) {
      toast.error("Please log in to like posts");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      await axios.post(`/api/like`, { postId: post._id }, { withCredentials: true });
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      setIsLiked((prev) => !prev);
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error(error.response?.data?.Msg || "Failed to like post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = () => {
    if (!UserInfo?._id) {
      toast.error("Please log in to comment");
      return;
    }
    setShowCommentInput((prev) => !prev);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    if (isCommentLoading) return;

    setIsCommentLoading(true);
    try {
      const response = await axios.post(
        `/api/addcomment`,
        {
          content: commentText,
          userID: UserInfo._id,
          postID: post._id,
        },
        { withCredentials: true }
      );
      const { Comment } = response.data;
      setComments((prev) => [Comment, ...prev]);
      setCommentText("");
      setShowCommentInput(false);
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.Msg || "Failed to add comment");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleAddComment = useCallback((newComment) => {
    const updateComments = (comments, newComment) => {
      if (!newComment.parentCommentID) {
        return [newComment, ...comments];
      }
      return comments.map((comment) => {
        if (comment._id === newComment.parentCommentID) {
          return {
            ...comment,
            replies: [newComment, ...(comment.replies || [])],
          };
        }
        return {
          ...comment,
          replies: updateComments(comment.replies || [], newComment),
        };
      });
    };
    setComments((prev) => updateComments(prev, newComment));
  }, []);

  const handleDeleteComment = useCallback(async (deletedCommentId) => {
    const previousComments = [...comments];
    const updateComments = (comments) =>
      comments
        .filter((comment) => comment._id !== deletedCommentId)
        .map((comment) => ({
          ...comment,
          replies: updateComments(comment.replies || []),
        }));

    setComments((prev) => updateComments(prev));
    toast.success("Comment deleted!"); // Show success immediately

    try {
      const response = await axios.delete(`/api/deletecomment/${deletedCommentId}`, {
        withCredentials: true,
      });
      console.log("Delete comment response:", response.data);
    } catch (error) {
      console.error("Error deleting comment:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Don't revert comments for certain errors (e.g., 404 means already deleted)
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.Msg || "Failed to delete comment");
        setComments(previousComments);
      }
    }
  }, [comments]);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(postID);
    }
  };

  const validMedia = (post.media || []).filter(
    (image) =>
      image &&
      typeof image === "string" &&
      image.startsWith("http") &&
      image.trim() !== ""
  );

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-3 border-b border-gray-300 hover:bg-gray-50 transition cursor-pointer">
      {UserInfo?._id === post.userID._id && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
          aria-label="Delete Post"
          title="Delete Post"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <img
          src={post.userID.profilepic || "/default-avatar.png"}
          alt={`${post.userID.username || "User"} Avatar`}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1">
          <Link to={`/users/${post.userID._id}`}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {post.userID.name || post.userID.username || "Unknown"}
              </span>
              <span className="text-gray-400">· {formatTime(post.createdAt)}</span>
            </div>
          </Link>

          <Link to={`/posts/${postID}`}>
            {post.content && <p className="text-gray-800 text-sm mt-1">{post.content}</p>}

            {validMedia.length > 0 && (
              <div
                className={`mt-3 grid gap-2 rounded-2xl overflow-hidden border border-gray-200 ${
                  validMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {validMedia.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Post Media ${index + 1}`}
                    className="w-full h-80 object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ))}
              </div>
            )}
          </Link>

          <div className="flex justify-between mt-3 max-w-xs text-gray-500 text-sm">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-2 transition ${
                isLiked ? "text-pink-500" : "hover:text-pink-500"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart
                className="w-4 h-4"
                fill={isLiked ? "currentColor" : "none"}
              />
              <span>{likesCount} Likes</span>
            </button>
            <button
              onClick={handleMessage}
              className="flex items-center gap-2 hover:text-blue-500 transition"
              aria-label="Comment on post"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comment ({comments.length})</span>
            </button>
          </div>

          {showCommentInput && (
            <div className="mt-4">
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                aria-label="Comment input"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCommentSubmit}
                  disabled={isCommentLoading}
                  className={`px-4 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 ${
                    isCommentLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label="Submit comment"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {comments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700">Comments</h3>
              {comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatTime = (timestamp) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diff = (now - postDate) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return postDate.toLocaleDateString();
};

export default PostUser;