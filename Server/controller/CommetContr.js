const Users = require("../models/UsersSchema");
const Posts = require("../models/PostsSchema");
const Comment = require("../models/CommentsSchema");
const mongoose = require("mongoose")

exports.CreateComment = async (req, res) => {
  try {
    const { content, userID, postID, parentCommentID } = req.body;

    if (!content || !userID || !postID) {
      return res.status(400).send({ Msg: "Content, userID, and postID are required" });
    }
    if (!mongoose.isValidObjectId(userID) || !mongoose.isValidObjectId(postID)) {
      return res.status(400).send({ Msg: "Invalid userID or postID" });
    }
    if (parentCommentID && !mongoose.isValidObjectId(parentCommentID)) {
      return res.status(400).send({ Msg: "Invalid parentCommentID" });
    }

    const comment = new Comment({
      content,
      userID,
      postID,
      parentCommentID: parentCommentID || null,
    });

    await comment.save();

    // Populate userID and postID in the response
    const populatedComment = await Comment.findById(comment._id)
      .populate("userID", "name username profilepic")
      .populate("postID", "content")
      .lean();

    console.log("New Comment Created:", populatedComment);
    res.status(200).send({ Msg: "New Comment", Comment: populatedComment });
  } catch (error) {
    console.error("Comment Creation Error:", error);
    res.status(500).send({ Msg: "Commenting failed", error: error.message });
  }
};

exports.DeleteComment = async (req, res) => {
  try {
    const { commentID } = req.body;
    const currentUserId = req.user._id;
    console.log("Deleting comment:", commentID, "by user:", currentUserId);
    const comment = await Comment.findById(commentID);
    if (!comment) {
      console.log("Comment not found:", commentID);
      return res.status(404).send({ Msg: "Comment not found" });
    }
    if (comment.userID.toString() !== currentUserId.toString()) {
      console.log("Unauthorized deletion attempt:", currentUserId);
      return res
        .status(400)
        .send({ Msg: "You are not authorized to delete this comment" });
    }
    const result = await Comment.findByIdAndDelete(commentID);
    console.log("Comment deletion result:", result);
    res.status(200).send({ Msg: "Comment deleted successfully" });
  } catch (error) {
    console.error("Comment Deletion Error:", error);
    res.status(500).send({ Msg: "Comment deletion failed", error });
  }
};

// exports.getComments = async (req, res) => {
//   try {
//     const { postID } = req.params;

//     const comments = await Comment.find({ postID })
//       .populate("userID", "name username profilepic") // Make sure userID ref is correct in schema
//       .sort({ createdAt: -1 });

//     res.status(200).send({ comments });
//   } catch (error) {
//     console.error("Error fetching comments:", error);
//     res.status(500).send({ Msg: "Failed to fetch comments" });
//   }
// };

exports.getComments = async (req, res) => {
  try {
    const { postID } = req.params;

    // Fetch all comments for the post
    const comments = await Comment.find({ postID })
      .populate("userID", "name username profilepic")
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance , use it only when reading and not going to make modifications

    // Build a tree structure for comments
    const commentTree = [];
    const commentMap = {};

    // Create a map of comments by ID
    comments.forEach((comment) => {
      comment.replies = []; // Initialize replies array
      commentMap[comment._id] = comment;
    });

    // Organize comments into a tree
    comments.forEach((comment) => {
      if (comment.parentCommentID) {
        // If comment has a parent, add it to the parent's replies
        if (commentMap[comment.parentCommentID]) {
          commentMap[comment.parentCommentID].replies.push(comment);
        }
      } else {
        // If no parent, it's a top-level comment
        commentTree.push(comment);
      }
    });

    res.status(200).send({ comments: commentTree });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send({ Msg: "Failed to fetch comments" });
  }
};

exports.getComment = async (req, res) => {
  try {
    const { commentID } = req.params;

    if (!mongoose.isValidObjectId(commentID)) {
      return res.status(400).send({ Msg: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentID)
      .populate("userID", "name username profilepic")
      .lean();

    if (!comment) {
      return res.status(404).send({ Msg: "Comment not found" });
    }

    // Fetch replies with max depth
    const fetchReplies = async (parentCommentID, depth = 0, maxDepth = 5) => {
      if (depth >= maxDepth) return [];

      const replies = await Comment.find({ parentCommentID })
        .populate("userID", "name username profilepic")
        .sort({ createdAt: -1 })
        .lean();

      for (const reply of replies) {
        reply.replies = await fetchReplies(reply._id, depth + 1, maxDepth);
      }

      return replies;
    };

    // Attach replies to the comment
    comment.replies = await fetchReplies(comment._id);

    console.log("Fetched comment:", commentID, comment);
    res.status(200).send({comment: comment });
  } catch (error) {
    console.error("Error fetching comment:", error.message);
    res.status(500).send({ Msg: "Failed to fetch comment", error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { commentID } = req.body;
    const currentUser = req.user;

    const comment = await Comment.findById(commentID);
    if (!comment) {
      return res.status(404).send({ Msg: "Comment not found" });
    }
    if (comment.listUsers.includes(currentUser._id)) {
      await Comment.findByIdAndUpdate(commentID, {
        $pull: { listUsers: currentUser._id },
        $inc: { likesCount : -1 }
      });

      return res.status(200).send({ Msg: "Comment unliked successfully" });
    } else {
      await Comment.findByIdAndUpdate(commentID, {
        $push: { listUsers: currentUser._id },
        $inc: { likesCount : 1 }
      });
      return res.status(200).send({ Msg: "Comment liked successfully" });
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to like/unlike comment", error });
  }
};


exports.getCommentsByUser = async (req, res) => {
  try {
    const { userID } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!mongoose.isValidObjectId(userID)) {
      return res.status(400).send({ Msg: "Invalid user ID" });
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ userID })
      .populate("userID", "name username profilepic")
      .populate("postID", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total comment count for pagination metadata
    const totalComments = await Comment.countDocuments({ userID });

    // If no comments, return empty array with pagination
    if (!comments || comments.length === 0) {
      return res.status(200).send({
        comments: [],
        pagination: {
          page,
          limit,
          totalComments: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentCommentID: comment._id })
          .populate("userID", "name username profilepic")
          .sort({ createdAt: -1 })
          .lean();
        return { ...comment, replies };
      })
    );

    console.log("Fetched comments for user:", userID, "Count:", comments.length);
    res.status(200).send({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        totalComments,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).send({ Msg: "Failed to fetch user comments", error: error.message });
  }
};