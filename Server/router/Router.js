const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Users = require("../models/UsersSchema");
const {
  logout,
  getCurrent,
  signin,
  signupuser,
  verifyEmailU,
  FollowUser,
  FriendRequest,
  AcceptReject,
  Unfriend,
  getFriends,
  getExploreSuggestions,
  getFriendRequests,
  getSingleuser,
  getAllUsers,
  EditProfile,
} = require("../controller/UsersContr");
const { signupvalidation, validation } = require("../middleware/verif");
const { isauth } = require("../middleware/isAuth");
const {
  CreatePost,
  getPosts,
  likePost,
  deletePost,
  uploadPostImage,
  getExploreSuggestionsF,
  getSinglepost,
  getUserPosts,
  getExploreSuggestionsFollow,
} = require("../controller/PostsContr");
const {
  CreateComment,
  DeleteComment,
  likeComment,
  getComments,
  getComment,
  getCommentsByUser,
} = require("../controller/CommetContr");

const URouter = express.Router();

// User Routes
URouter.post("/signup", signupvalidation, validation, signupuser);
URouter.post("/signin", signupvalidation, validation, signin);
URouter.get("/getcurrent", isauth, getCurrent);
URouter.get("/verifyaccount/:token", verifyEmailU);
URouter.post("/logout", logout);
URouter.post("/follow", isauth, FollowUser);
URouter.post("/friendrequest", isauth, FriendRequest);
URouter.post("/addfriend", isauth, AcceptReject);
URouter.post("/unfriend", isauth, Unfriend);
URouter.get("/listfriends", isauth, getFriends);
URouter.get("/getusers", isauth, getExploreSuggestions);
URouter.get("/getfposts", isauth, getExploreSuggestionsF);
URouter.get("/getfollowposts", isauth, getExploreSuggestionsFollow);
URouter.get("/getrequests", isauth, getFriendRequests);
URouter.get("/users/:userID", isauth, getSingleuser);
URouter.get("/getallusers", isauth, getAllUsers);
URouter.post("/editprofile", isauth, EditProfile);
// Posts Routes
URouter.post("/addpost", isauth, CreatePost);
URouter.get("/getposts", isauth, getPosts);
URouter.get("/posts/:postID", isauth, getSinglepost);
URouter.post("/like", isauth, likePost);
URouter.delete("/deletepost/:postID", isauth, deletePost);
URouter.get("/userposts/:userID", isauth, getUserPosts);

// Comment Routes
URouter.post("/addcomment", isauth, CreateComment);
URouter.post("/likecomment", isauth, likeComment);
URouter.delete("/deletecomment", isauth, DeleteComment);
URouter.get("/comments/:postID", isauth, getComments);
URouter.get("/comment/:commentID", isauth, getComment);
URouter.get("/commentbyuser/:userID", isauth, getCommentsByUser);
module.exports = URouter;