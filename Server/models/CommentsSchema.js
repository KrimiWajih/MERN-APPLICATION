const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  postID: { type: mongoose.Schema.Types.ObjectId, ref: "Posts", required: true }, 
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  content: { type: String, required: true }, 
  parentCommentID: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, 
  likesCount: { type: Number, default: 0 } ,
  listUsers : [{type : mongoose.Schema.Types.ObjectId , ref : "Users"}]
}, { timestamps: true });

const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
