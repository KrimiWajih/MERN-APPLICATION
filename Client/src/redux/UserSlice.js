import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


const apiUrl = "https://mern-application-w42i.onrender.com/";
const initialState = {
  UserInfo: [],
  AllUsers : [],
  Friends :[],
  Posts :[],
  FPosts: [],
  FollowPosts :[],
  Comments: [],
  FriendRequests : [],
  UserConnect : [],
  UserFollow : [],
  Loading: false,
  error: null,
};

export const getCurrent = createAsyncThunk("Users/getUser", async () => {
  const response = await axios.get(`${apiUrl}getcurrent`, {
    withCredentials: true,
  });
  return response.data.User;
});

export const getFriends = createAsyncThunk("Users/getFriends", async () => {
  const response = await axios.get(`${apiUrl}listfriends`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.Friends;
});

export const getConnect = createAsyncThunk("Users/getconnect", async () => {
  const response = await axios.get(`${apiUrl}getusers`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.connect;
});

export const getFollow = createAsyncThunk("Users/getfollow", async () => {
  const response = await axios.get(`${apiUrl}getusers`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.follow;
});


export const getRequests = createAsyncThunk("Users/getreq", async () => {
  const response = await axios.get(`${apiUrl}getrequests`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.Requests;
});

export const getPosts = createAsyncThunk("Users/getposts", async () => {
  const response = await axios.get(`${apiUrl}getposts`, {
    withCredentials: true,
  });
  console.log(response.data.Post);
  return response.data.Post;
});



export const getFPosts = createAsyncThunk("Users/getfposts", async () => {
  const response = await axios.get(`${apiUrl}getfposts`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.Post;
});



export const getFollowPosts = createAsyncThunk("Users/getfollowposts", async () => {
  const response = await axios.get(`${apiUrl}getfollowposts`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data.Post;
});


export const getComments = createAsyncThunk("user/getComments", async (userID) => {
  const response = await axios.get(`${apiUrl}commentbyuser/${userID}`, { withCredentials: true });
  return response.data;
});


export const getAllUsers = createAsyncThunk("Users/getallusers", async () => {
  const response = await axios.get(`${apiUrl}getallusers`, {
    withCredentials: true,
  });
  console.log(response.data.Users);
  return response.data.Users;
});



export const UserSlice = createSlice({
  name: "ConnectedUser",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCurrent.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getCurrent.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.UserInfo = action.payload;
      })
      .addCase(getCurrent.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getFriends.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getFriends.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.Friends = action.payload;
      })
      .addCase(getFriends.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getConnect.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getConnect.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.UserConnect = action.payload;
      })
      .addCase(getConnect.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getFollow.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getFollow.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.UserFollow = action.payload;
      })
      .addCase(getFollow.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getRequests.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getRequests.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.FriendRequests= action.payload;
      })
      .addCase(getRequests.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getPosts.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getPosts.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.Posts= action.payload;
      })
      .addCase(getPosts.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getFPosts.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getFPosts.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.FPosts= action.payload;
      })
      .addCase(getFPosts.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getComments.pending, (state) => {
        state.Loading = true;
      })
      .addCase(getComments.fulfilled, (state, action) => {
        state.Loading = false;
        state.Comments = action.payload.comments; 
      })
      .addCase(getComments.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
      .addCase(getFollowPosts.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getFollowPosts.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.FollowPosts= action.payload;
      })
      .addCase(getFollowPosts.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      })
       .addCase(getAllUsers.pending, (state, action) => {
        state.Loading = true;
        console.log(action);
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.Loading = false;
        state.error = null;
        state.AllUsers= action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.Loading = false;
        state.error = action.error.message;
      });
  },
});

export const UserReducer = UserSlice.reducer;
