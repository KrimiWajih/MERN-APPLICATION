import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import Comment from "./Comment";

const CommentsPage = () => {
  const { postID, commentID } = useParams();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [commentPostID, setCommentPostID] = useState(null); // Store postID from comment
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use "/api" for proxy, or "http://localhost:5000/api" if no proxy
  const API_BASE_URL = "https://mern-application-w42i.onrender.com";

  // Log params for debugging
  useEffect(() => {
    console.log("Params:", { postID, commentID });
    if (!postID && !commentID) {
      console.error("No postID or commentID provided, redirecting to home");
      toast.error("Invalid URL, redirecting to home");
      navigate("/home");
    }
  }, [postID, commentID, navigate]);

  // Fetch comments or a single comment based on URL params
  useEffect(() => {
    if (commentID) {
      console.log("Fetching single comment for commentID:", commentID);
      fetchSingleComment(commentID);
    } else if (postID) {
      console.log("Fetching comments for postID:", postID);
      const fetchComments = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/comments/${postID}`,
            { withCredentials: true }
          );
          console.log("Fetched comments:", response.data.comments);
          setComments(response.data.comments || []);
        } catch (error) {
          console.error(
            "Error fetching comments:",
            error.response?.data || error.message
          );
          setError("Failed to load comments. Please try again.");
          toast.error(error.response?.data?.Msg || "Failed to load comments.");
          if (error.response?.status === 401) {
            navigate("/"); // Redirect to login if unauthorized
          } else if (error.response?.status === 400) {
            navigate("/home"); // Redirect if invalid postID
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchComments();
    }
  }, [postID, commentID, navigate]);

  // Fetch a single comment and its replies (debounced)
  const fetchSingleComment = debounce(async (commentID) => {
    if (!commentID) {
      console.error("No commentID provided for fetchSingleComment");
      toast.error("Invalid comment ID");
      return;
    }
    console.log("Sending request to:", `${API_BASE_URL}/comment/${commentID}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/comment/${commentID}`, {
        withCredentials: true,
      });
      console.log("Fetched single comment:", response.data.comment);
      if (!response.data.comment) {
        console.warn("Comment not found in response");
        throw new Error("Comment not found");
      }
      setSelectedComment(response.data.comment);
      setCommentPostID(response.data.comment.postID); // Store postID from comment
    } catch (error) {
      console.error(
        "Error fetching single comment:",
        error.response?.data || error.message
      );
      setError("Failed to load comment.");
      toast.error(error.response?.data?.Msg || "Failed to load comment.");
      if (error.response?.status === 401) {
        console.error("Unauthorized, redirecting to login");
        navigate("/"); // Redirect to login if unauthorized
      } else if (error.response?.status === 400 || error.response?.status === 404) {
        console.error("Invalid or non-existent commentID, redirecting");
        navigate(`/posts/${postID || "home"}`); // Redirect to post or home
      }
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Handle adding a new comment with optimistic update and refresh
  const handleAddComment = async (newComment) => {
    const targetPostID = postID || commentPostID;
    if (!targetPostID) {
      console.error("No valid postID available for adding comment");
      toast.error("Cannot add comment: Invalid post ID");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      ...newComment,
      _id: tempId,
      replies: [],
      listUsers: [],
      likesCount: 0,
    };
    const updateComments = (comments, comment) => {
      if (!comment.parentCommentID) {
        return [comment, ...comments];
      }
      return comments.map((c) => {
        if (c._id === comment.parentCommentID) {
          return { ...c, replies: [comment, ...(c.replies || [])] };
        }
        return { ...c, replies: updateComments(c.replies || [], comment) };
      });
    };
    setComments((prev) => updateComments(prev, optimisticComment));

    try {
      console.log("Adding comment to postID:", targetPostID, "with data:", newComment);
      const response = await axios.post(
        `${API_BASE_URL}/comments/${targetPostID}`,
        newComment,
        { withCredentials: true }
      );
      console.log("Add comment response:", response.data);
      if (!response.data.Comment) {
        console.warn("Response missing Comment field:", response.data);
        throw new Error("Invalid response: Comment not found");
      }
      console.log("Added comment:", response.data.Comment);
      setComments((prev) =>
        updateComments(prev, response.data.Comment).filter(
          (c) => c._id !== tempId
        )
      );
      toast.success("Comment added successfully!");

      // Refresh comments after successful reply
      if (commentID) {
        console.log("Refreshing single comment after reply:", commentID);
        fetchSingleComment(commentID);
      } else if (postID) {
        console.log("Refreshing comments for postID:", postID);
        const fetchComments = async () => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/comments/${postID}`,
              { withCredentials: true }
            );
            setComments(response.data.comments || []);
          } catch (error) {
            console.error("Error refreshing comments:", error);
          }
        };
        fetchComments();
      }
    } catch (error) {
      console.error(
        "Error adding comment:",
        error.response?.data || error.message,
        "Status:",
        error.response?.status,
        "Response:",
        error.response
      );
      setComments((prev) => prev.filter((c) => c._id !== tempId));

      // Handle critical errors with specific toasts
      if (error.response?.status === 401) {
        toast.error("Please log in to add a comment.");
        navigate("/");
      } else if (error.response?.status === 400) {
        toast.error("Invalid post ID. Please try again.");
      }

      // Refresh to check if comment was added
      if (commentID) {
        console.log("Attempting to refresh single comment due to error:", commentID);
        fetchSingleComment(commentID);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-3">
      <h2 className="text-lg font-semibold text-gray-800">Comments</h2>
      {isLoading ? (
        <p>Loading comments...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : selectedComment ? (
        <div>
          <button
            onClick={() => {
              console.log("Navigating back to post with postID:", commentPostID || postID);
              setSelectedComment(null);
              const targetPostID = commentPostID || postID || "home";
              navigate(`/posts/${targetPostID}`);
            }}
            className="mb-4 text-blue-500 underline"
            aria-label="Return to post"
          >
            Back to Post
          </button>
          <Comment
            comment={selectedComment}
            postId={postID || commentPostID} // Pass postID for replies
            onAddComment={handleAddComment}
            onCommentClick={fetchSingleComment}
          />
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <Comment
            key={comment._id}
            comment={comment}
            postId={postID}
            onAddComment={handleAddComment}
            onCommentClick={fetchSingleComment}
          />
        ))
      ) : (
        <p className="text-gray-600">No comments yet.</p>
      )}
    </div>
  );
};

export default CommentsPage;
