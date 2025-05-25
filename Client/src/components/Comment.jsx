import React, { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const Comment = ({ comment, postId, onAddComment, onCommentClick, onDeleteComment }) => {
  const { UserInfo } = useSelector((state) => state.userdata);
  const [isLiked, setIsLiked] = useState(
    comment.listUsers?.includes(UserInfo?._id) || false
  );
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplyLoading, setIsReplyLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const formatTime = (timestamp) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diff = (now - commentDate) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return commentDate.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!UserInfo?._id) {
      toast.error("Please log in to like comments");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      await axios.post(
        "https://mern-application-w42i.onrender.com/likeComment",
        { commentID: comment._id },
        { withCredentials: true }
      );
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      setIsLiked((prev) => !prev);
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = () => {
    if (!UserInfo?._id) {
      toast.error("Please log in to reply");
      return;
    }
    setShowReplyInput((prev) => !prev);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    if (isReplyLoading) return;

    setIsReplyLoading(true);
    try {
      const response = await axios.post(
        "https://mern-application-w42i.onrender.com/addcomment",
        {
          content: replyText,
          userID: UserInfo._id,
          postID: postId,
          parentCommentID: comment._id,
        },
        { withCredentials: true }
      );

      const { Comment } = response.data;
      onAddComment(Comment);
      setReplyText("");
      setShowReplyInput(false);
      setShowReplies(true);
      toast.success("Reply added!");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setIsReplyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!UserInfo?._id) {
      toast.error("Please log in to delete comments");
      return;
    }
    if (isDeleteLoading) return;

    setIsDeleteLoading(true);
    try {
      const response = await axios.delete("https://mern-application-w42i.onrender.com/deletecomment", {
        data: { commentID: comment._id },
        withCredentials: true,
      });

      toast.success(response.data.Msg);
      onDeleteComment?.(comment._id); // Notify parent to remove comment
    } catch (error) {
      toast.error(error.response?.data?.Msg || "Failed to delete comment");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const toggleReplies = () => {
    setShowReplies((prev) => !prev);
  };

  return (
    <div className="mt-2 flex items-start gap-2 pt-2 w-full">
      <img
        src={comment.userID?.profilepic || "/default-avatar.png"}
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0 break-words">
        <Link to={`/users/${comment.userID._id}`}>
          <div className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded w-full">
            <span className="font-semibold truncate">
              {comment.userID?.name || comment.userID?.username || "Unknown"}
            </span>
            <span className="text-gray-400 flex-shrink-0">
              · {formatTime(comment.createdAt)}
            </span>
          </div>
        </Link>

        <Link to={`/comment/${comment._id}`}>
          <p
            onClick={() => onCommentClick?.(comment._id)}
            className="text-gray-800 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded break-all whitespace-pre-wrap overflow-hidden w-full"
          >
            {comment.content}
          </p>
        </Link>

        <div className="flex gap-4 mt-2 text-gray-600 text-sm flex-wrap">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-200 transition ${
              isLiked ? "text-pink-500" : "hover:text-pink-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart
              className="w-5 h-5"
              fill={isLiked ? "currentColor" : "none"}
            />
            <span>{likesCount} Likes</span>
          </button>
          <button
            onClick={handleReply}
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-200 hover:text-blue-500 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Reply</span>
          </button>
          {UserInfo?._id === comment.userID._id && (
            <button
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-200 hover:text-red-500 transition ${
                isDeleteLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Delete</span>
            </button>
          )}
        </div>

        {showReplyInput && (
          <div className="mt-2 w-full">
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 break-all whitespace-pre-wrap"
              rows="2"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleReplySubmit}
                disabled={isReplyLoading}
                className={`px-4 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 ${
                  isReplyLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Post Reply
              </button>
            </div>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <button
            onClick={toggleReplies}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            {showReplies
              ? `Hide ${comment.replies.length} ${
                  comment.replies.length === 1 ? "Reply" : "Replies"
                }`
              : `Show ${comment.replies.length} ${
                  comment.replies.length === 1 ? "Reply" : "Replies"
                }`}
          </button>
        )}

        {showReplies && comment.replies?.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200 w-full break-words reply-indent">
            {comment.replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                postId={postId}
                onAddComment={onAddComment}
                onCommentClick={onCommentClick}
                onDeleteComment={onDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
