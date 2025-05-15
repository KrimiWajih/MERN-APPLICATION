const Users = require("../models/UsersSchema");
const Posts = require("../models/PostsSchema");
const Comment = require("../models/CommentsSchema");






// exports.CreatePost = async (req, res) => {
//   try {
//     const { content, userID } = req.body;
//     const post = new Posts({ content, userID });
//     await post.save();
//     console.log("New Post Created:", post);
//     res.status(200).send({ Msg: "New Post", Post: post });
//   } catch (error) {
//     console.error("Post Creation Error:", error);
//     res.status(500).send({ Msg: "Connection failed" });
//   }
// };



exports.CreatePost = async (req, res) => {
  try {
    const { content, userID, media } = req.body;


    if (!userID) {
      return res.status(400).json({ Msg: "userID is required" });
    }

    if (!content && (!media || !media.length)) {
      return res.status(400).json({ Msg: "Post content or media is required" });
    }

   
    let mediaArray = [];
    if (media) {
      let parsedMedia = media;
  
      if (typeof media === "string") {
        try {
          parsedMedia = JSON.parse(media);
        } catch (e) {
          return res.status(400).json({ Msg: "Invalid media format" });
        }
      }
   
      mediaArray = Array.isArray(parsedMedia)
        ? parsedMedia.flat(Infinity).filter((url) => {
            if (typeof url !== "string" || !url.trim()) return false;
            try {
              const parsedUrl = new URL(url);
              return ["http:", "https:"].includes(parsedUrl.protocol);
            } catch {
              return false;
            }
          })
        : [];
      if (mediaArray.length && mediaArray.some((url) => !url.match(/^https?:\/\//))) {
        return res.status(400).json({ Msg: "Invalid media URL" });
      }
    }

    const post = new Posts({
      content: content || "",
      userID,
      media: mediaArray,
      type: "original",
      likesCount: 0,
      listUsers: [],
      originalPost: null,
    });

    const savedPost = await post.save();
    const populatedPost = await Posts.findById(savedPost._id).populate(
      "userID",
      "username name profilepic"
    );

    console.log("New Post Created:", populatedPost);
    res.status(201).json({ Msg: "New Post", Post: populatedPost });
  } catch (error) {
    console.error("Post Creation Error:", error);
    res.status(500).json({ Msg: "Failed to create post", Error: error.message });
  }
};




exports.getPosts = async (req, res) => {
  const currentUser = req.user;
  try {
    const posts = await Posts.find({ userID : currentUser._id }).sort({ createdAt: -1 }).populate("userID");
    console.log(posts);
    res.status(200).send({ Msg: "All Posts", Post: posts });
  } catch (error) {
    res.status(500).send({ Msg: "Error fetching" });
  }
};

exports.getUserPosts = async (req, res) => {
  const {userID} = req.params;
  try {
    const posts = await Posts.find({ userID : userID }).sort({ createdAt: -1 }).populate("userID");
    console.log(posts);
    res.status(200).send({ Msg: "All Posts", Post: posts });
  } catch (error) {
    res.status(500).send({ Msg: "Error fetching" });
  }
};


exports.getSinglepost = async (req, res) => {
  const currentUser = req.user; // Assuming middleware sets this
  const { postID } = req.params;

  try {
    const post = await Posts.findById(postID).populate("userID");

    if (!post) {
      return res.status(404).send({ Msg: "Post not found" });
    }

    res.status(200).send({ Msg: "Post fetched successfully", Post: post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send({ Msg: "Error fetching post", error: error.message });
  }
};




exports.likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const currentUser = req.user;

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).send({ Msg: "Post not found" });
    }

    if (post.listUsers.includes(currentUser._id)) {
      await Posts.findByIdAndUpdate(postId, {
        $pull: { listUsers: currentUser._id }
      });

      post.likesCount -=1; 
      await post.save();

      return res.status(200).send({ Msg: "Post unliked successfully" });
    } else {
     
      post.listUsers.push(currentUser._id);
      await post.save();

      post.likesCount += 1;
      await post.save();

      return res.status(200).send({ Msg: "Post liked successfully" });
    }

  } catch (error) {
    res.status(500).send({ Msg: "Failed to like/unlike post", error });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const { postID } = req.params;
    const currentUser = req.user;
    const post = await Posts.findOne({ _id: postID, userID: currentUser._id });
    
    if (!post) {
      return res.status(404).send({ Msg: "Post not found or unauthorized" });
    }
    await Comment.deleteMany({ postID: postID });
    // const user = await Users.findById(currentUser._id)
    // user.likedPosts = user.likedPosts.filter((el) => el.toString() !== postId.toString())  
    // await user.save()
    await Posts.findByIdAndDelete(postID);

    res.status(200).send({ Msg: "Post Deleted Successfully" });
  } catch (error) {
    res.status(500).send({ Msg: "Failed to delete post", error });
  }
};


exports.getExploreSuggestionsF = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch the current user's friends
    const user = await Users.findById(currentUserId).select('listFriends'); // Assuming 'listFriends' contains the friend IDs

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const friends = user.listFriends;

    if (friends.length === 0) {
      return res.status(404).json({ message: "No friends found." });
    }

    // Fetch posts from friends, sort by date (most recent first)
    const posts = await Posts.find({ userID: { $in: friends } })
      .sort({ createdAt: -1 }) // Sort posts by creation date (descending)
      .populate("userID", "name profilepic" ); // Optionally populate user data, like name

    // Check if posts are found
    if (!posts.length) {
      return res.status(404).json({ message: "No posts from friends found." });
    }

    // Return the posts sorted by date
    return res.status(200).send({Msg : "Friends posts" , Post : posts});
    
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};



exports.getExploreSuggestionsFollow = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch the current user's following list
    const user = await Users.findById(currentUserId).select('following');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follows = user.following || []; // Ensure follows is an array

    if (follows.length === 0) {
      return res.status(200).json({ message: "You're not following anyone", posts: [] });
    }

    // Fetch posts from followed users, sorted by most recent
    const posts = await Posts.find({ userID: { $in: follows } })
      .sort({ createdAt: -1 }) // Sort by creation date (descending)
      .populate("userID", "name profilepic") // Populate user data
      .limit(20); // Optional: Limit to 20 posts for performance

    return res.status(200).json({
      message: "Posts from users you follow",
      Post: posts || [],
    });
  } catch (error) {
    console.error("Error fetching explore suggestions:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
