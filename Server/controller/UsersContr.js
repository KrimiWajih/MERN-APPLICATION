const Users = require("../models/UsersSchema");
const Friends = require("../models/FriendsSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretkey = process.env.SECRET_JWT;
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const salt = Number(process.env.SALT_C);
exports.verifyEmailU = async (req, res) => {
  const { token } = req.params;
  try {
    const decodedToken = jwt.verify(token, secretkey);
    const user = await Users.findById(decodedToken.id);
    if (!user) {
      return res.status(404).send({ Msg: "User not found" });
    }
    if (user.status === "verified") {
      return res.status(400).send({ Msg: "Account already verified" });
    }
    user.status = "verified";
    await user.save();
    res.status(200).send({ Msg: "Account verified successfully!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).send({ Msg: "Invalid or expired token" });
    }
    res.status(500).send({ Msg: "Failed to verify account", error });
  }
};

exports.signupuser = async (req, res) => {
  const { name, email, password, username } = req.body;

  // Gmail SMTP transporter (kept exactly as you had it)
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // TLS
    auth: {
      user: "wajihkurousagi@gmail.com",
      pass: "vagm seay dcmo ltnz" // "vagmseaydcmoltnz"
    },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    family: 4, // force IPv4
  });

  try {
    // 1) prevent duplicate
    const testuser = await Users.findOne({ email });
    if (testuser) {
      return res.status(400).send({ Msg: "User already exists" });
    }

    // 2) hash & stage create
    const hpassword = bcrypt.hashSync(password, salt);
    const newuser = new Users({ name, email, password: hpassword, username });

    // 3) token + verify link
    const token = jwt.sign(
      { id: newuser._id, email: newuser.email },
      secretkey,
      { expiresIn: "7d" }
    );
    const verifyUrl = `https://mern-application-1-fozj.onrender.com/verifyaccount/${token}`;

    // 4) attempt to send email (fallback if network blocked)
    const mailoptions = {
      from: `"TuneSphere" <wajihkurousagi@gmail.com>`,
      to: email,
      subject: "Please Verify Your Account",
      html: `
        <h1>Welcome to our website</h1>
        <p>Please verify your account by clicking the link below:</p>
        <a href="${verifyUrl}">Verify Account</a>
      `,
      text: `Welcome! Verify your account: ${verifyUrl}`,
    };

    let emailSent = false;

    try {
      // verify() opens a connection; if it times out we still continue
      await transporter.verify();
      await transporter.sendMail(mailoptions);
      emailSent = true;
    } catch (mailErr) {
      // Network or SMTP failure — continue with signup and return the link
      console.warn("Email send failed; continuing with signup.", {
        code: mailErr?.code,
        responseCode: mailErr?.responseCode,
        message: mailErr?.message,
      });
    }

    // 5) persist user regardless of email outcome
    await newuser.save();

    // 6) respond
    if (emailSent) {
      return res.status(201).send({
        Msg: "User registered successfully. Please check your email for verification.",
      });
    } else {
      return res.status(201).send({
        Msg:
          "User registered. Email could not be delivered from this environment.",
        verifyUrl, // let the frontend open this directly
      });
    }
  } catch (error) {
    console.error("Signup/Email error:", {
      code: error?.code,
      responseCode: error?.responseCode,
      response: error?.response,
      message: error?.message,
    });
    return res.status(500).send({
      Msg: "Failed to register or send verification email",
      code: error?.code,
      responseCode: error?.responseCode,
      response: error?.response,
      message: error?.message,
    });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    let UserFound = await Users.findOne({ email });
    console.log(UserFound);
    if (!UserFound) {
      res.status(400).send({ Msg: "User not found" });
    } else {
      const match = bcrypt.compareSync(password, UserFound.password);
      if (!match) {
        res.status(500).send({ Msg: "Wrong Password" });
      } else {
        const token = jwt.sign(
          { id: UserFound._id, name: UserFound.name },
          secretkey,
          {
            expiresIn: "7d",
          }
        );
      res.cookie('token', token, {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7 * 1000,
  secure: process.env.NODE_ENV === 'production', // Set to true in production (HTTPS)
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Allow cross-origin in production
});
        res
          .status(200)
          .send({ Msg: "Login Successful", User: UserFound, token });
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to login" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true });
  return res.status(200).send({ Msg: "Logged out" });
};

exports.getCurrent = async (req, res) => {
  try {
    const user = req.user;
    console.log('User in getCurrent:', user);
    if (!user) {
      return res.status(401).send({ Msg: 'No user found in request' });
    }
    const response = { Msg: 'Connecting User', User: user };
    console.log('getCurrent response:', response);
    res.status(200).send(response);
  } catch (error) {
    console.error('Error in getCurrent:', error);
    res.status(500).send({ Msg: 'Internal server error', error: error.message });
  }
};



exports.EditProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user; // Handle req.user as object or ID
    const { profilepic, coverpic, bio } = req.body;

    // Validate input: at least one field must be provided
    if (!profilepic && !coverpic && !bio) {
      return res.status(400).json({ Msg: "At least one of profile picture, cover picture, or bio is required" });
    }

    // Validate URLs if provided
    if (profilepic && (typeof profilepic !== "string" || !profilepic.startsWith("https://res.cloudinary.com"))) {
      return res.status(400).json({ Msg: "Invalid profile picture URL" });
    }
    if (coverpic && (typeof coverpic !== "string" || !coverpic.startsWith("https://res.cloudinary.com"))) {
      return res.status(400).json({ Msg: "Invalid cover picture URL" });
    }
    if (bio && (typeof bio !== "string" || bio.length > 160)) {
      return res.status(400).json({ Msg: "Bio must be a string and not exceed 160 characters" });
    }

    // Update user
    const FoundUser = await Users.findById(userId);
    if (!FoundUser) {
      return res.status(404).json({ Msg: "User not found" });
    }

    // Update provided fields
    if (profilepic) FoundUser.profilepic = profilepic;
    if (coverpic) FoundUser.coverpic = coverpic;
    if (bio !== undefined) FoundUser.bio = bio; // Allow empty string to clear bio
    await FoundUser.save();

    // Return updated user data
    const updatedUser = {
      _id: FoundUser._id,
      username: FoundUser.username,
      name: FoundUser.name,
      profilepic: FoundUser.profilepic,
      coverpic: FoundUser.coverpic,
      bio: FoundUser.bio,
    };

    console.log("Profile updated:", updatedUser);
    res.status(200).json({ Msg: "Profile updated", User: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ Msg: "Failed to update profile", Error: error.message });
  }
};




exports.FollowUser = async (req, res) => {
  try {
    const currentUser = await Users.findById(req.user._id);
    const { followedID } = req.body;

    if (currentUser._id.toString() === followedID) {
      return res.status(400).send({ Msg: "You cannot follow yourself" });
    }
    const Followed = await Users.findById(followedID);
    if (!Followed) {
      return res.status(404).send({ Msg: "User not found" });
    }
    if (currentUser.following.includes(followedID)) {
      await Users.findByIdAndUpdate(currentUser._id, {
        $pull: { following: followedID },
      });
      await Users.findByIdAndUpdate(followedID, {
        $pull: { followers: currentUser._id },
      });

      return res.status(200).send({ Msg: "User unfollowed successfully" , Res : "unfollow" });
    } else {
      // currentUser.following.push(followedID)
      // await currentUser.save()
      // Followed.followers.push(currentUser._id)
      // await Followed.save();

      await Users.findByIdAndUpdate(currentUser._id, {
        $push: { following: followedID },
      });

      await Users.findByIdAndUpdate(followedID, {
        $push: { followers: currentUser._id },
      });
      return res.status(200).send({ Msg: "User Followed successfully", Res : "follow"});
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to follow/unfollow user", error });
  }
};

exports.FriendRequest = async (req, res) => {
  try {
    const currentUser = req.user._id;
    const { receiverId } = req.body;
    if (currentUser.toString() === receiverId) {
      return res
        .status(400)
        .send({ message: "You cannot send a friend request to yourself." });
    }

    const currentUserData = await Users.findById(currentUser);

    if (currentUserData.listFriends.includes(receiverId)) {
      return res.status(400).send({ message: "You are already friends." });
    }

    const pendingRequest = await Friends.findOne({
      senderId: currentUser,
      receiverId: receiverId,
      status: "pending",
    });

    if (pendingRequest) {
      return res.status(400).send({ message: "Friend request already sent." });
    }

    const newRequest = new Friends({
      senderId: currentUser,
      receiverId: receiverId,
      status: "pending",
    });

    await newRequest.save();

    return res
      .status(200)
      .send({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).send({ message: "Failed to send friend request.", error });
  }
};

exports.AcceptReject = async (req, res) => {
  try {
    const currentUser = req.user._id;
    const { response, friendreqID } = req.body;

    const FriendRequest = await Friends.findById(friendreqID);
    if (!FriendRequest) { 
      return res.status(400).send({ Msg: "Friend request doesn't exist" });
    }
    const { senderId, receiverId, status } = FriendRequest;
    if (
      currentUser.toString() !== senderId.toString() &&
      currentUser.toString() !== receiverId.toString()
    ) {
      return res
        .status(400)
        .send({ Msg: "You are not authorized to respond to this request" });
    }

    if (status === "pending") {
      if (response === "accept") {
        await Users.findByIdAndUpdate(senderId, {
          $push: { listFriends: receiverId },
        });
        await Users.findByIdAndUpdate(receiverId, {
          $push: { listFriends: senderId },
        });

        // await Friends.findByIdAndDelete(friendreqID);
        await Friends.findByIdAndUpdate(friendreqID, {
          status: "accepted",
        });

        return res.status(200).send({ Msg: "Friend request accepted" });
      } else if (response === "reject") {
        await Friends.findByIdAndUpdate(friendreqID, {
          status: "rejected",
        });
        // await Friends.findByIdAndDelete(friendreqID);

        return res.status(200).send({ Msg: "Friend request rejected" });
      } else {
        return res.status(400).send({ Msg: "Invalid response" });
      }
    } else {
      return res
        .status(400)
        .send({ Msg: "This request has already been responded to" });
    }
  } catch (error) {
    console.error("Error processing friend request:", error);
    res.status(500).send({ Msg: "Failed to respond to friend request", error });
  }
};

exports.Unfriend = async (req, res) => {
  try {
    const currentUser = await Users.findById(req.user._id);
    const { unfriendID } = req.body;
    if (currentUser._id === unfriendID) {
      return res.status(400).send({ Msg: "You cannot unfriend yourself." });
    }
    if (!currentUser.listFriends.includes(unfriendID)) {
      return res.status(400).send({ Msg: "User is not in your friend list." });
    }
    await Users.findByIdAndUpdate(currentUser._id, {
      $pull: { listFriends: unfriendID },
    });
    await Users.findByIdAndUpdate(unfriendID, {
      $pull: { listFriends: currentUser._id },
    });

    return res.status(200).send({ Msg: "User unfriended successfully" });
  } catch (error) {
    console.error("Error processing friend request:", error);
    res.status(500).send({ Msg: "Failed to unfriend", error });
  }
};



exports.getFriends = async (req, res) => {
  try {
    const currentUser = await Users.findById(req.user._id).populate("listFriends");
    console.log(currentUser.listFriends)
    return res.status(200).send({ Msg: "List Friends", Friends: currentUser.listFriends });
  } catch (error) {
    res.status(500).send({ Msg: "Error fetching friends list", error });
  }
};


exports.getExploreSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user._id; 

    const numberOfSuggestions = 16; 

    // Fetch suggestions with the necessary conditions
    const suggestions = await Users.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
          followers: { $not: { $in: [new mongoose.Types.ObjectId(currentUserId)] } },
          following: { $not: { $in: [new mongoose.Types.ObjectId(currentUserId)] } },
          listFriends: { $not: { $in: [new mongoose.Types.ObjectId(currentUserId)] } }
        }
      },
      { $sample: { size: numberOfSuggestions } }
    ]);
    

    // Check if suggestions are returned
    if (!suggestions.length) {
      return res.status(404).json({ message: "No suggestions found." });
    }

    // Randomly shuffle and split the suggestions into two categories (Connect and Follow)
    const half = Math.floor(suggestions.length / 2);
    const shuffled = suggestions.sort(() => 0.5 - Math.random());

    const connect = shuffled.slice(0, half);
    const follow = shuffled.slice(half);

    // Send response with the shuffled results
    return res.status(200).json({
      connect,
      follow
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const user = req.user;  // Get the current logged-in user

    // Find all friend requests where the current user is the receiver
    const listRequests = await Friends.find({ receiverId: user._id , status : "pending"})
      .populate('senderId', 'name profilepic bio')  // Optionally populate sender's details
      .sort({ createdAt: -1 }); // Sort the requests, for example, by most recent

    if (listRequests.length === 0) {
      return res.status(200).json({ Msg: "No friend requests found" });
    }

    return res.status(200).json({
      Msg: "List of Friend Requests",
      Requests: listRequests,
    });
  } catch (error) {
    console.error(error.message); 
    return res.status(500).json({
      Msg: "Failed to fetch friend requests",
      Error: error.message,
    });
  }
};
exports.getSingleuser = async (req, res) => {
  const currentUser = req.user;
  const { userID } = req.params;

  try {
    const user = await Users.findById(userID);

    if (!user) {
      return res.status(404).send({ Msg: "User not found" });
    }

    res.status(200).send({ Msg: "User fetched successfully", User: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send({ Msg: "Error fetching user", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find().select("name username profilepic");

    if (users.length === 0) {
      return res.status(404).send({ Msg: "No users found" });
    }

    res.status(200).send({ Msg: "Users fetched successfully", Users: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ Msg: "Error fetching users", error: error.message });
  }
};
