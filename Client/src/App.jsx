// App.js
import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import { SpotifyPlayerProvider } from './components/SpotifyPlayerContext';
import Login from './components/Login';
import NavigationBar from './components/NavigationBar';
import Explore from './components/Explore';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Music from './components/Music';
import Friends from './components/Friends';
import Home from './components/Home';
import Signup from './components/SignUp';

import { ToastContainer } from 'react-toastify';
import VerifyAccount from './components/VerifyAccount';
import Notification from './components/Notification';
import Posts from './components/Posts';
import ProfileUser from './components/ProfileUser';
import Callback from './components/Callback';
import Music1 from './components/Music1';
import CommentsPage from './components/CommentsPage';

const Layout = () => (
  <div className="flex w-full min-h-screen">
    <div className="w-[25%]">
      <NavigationBar />
    </div>
    <div className="w-[50%] overflow-y-auto overflow-x-hidden px-4 py-6">
      <Outlet />
    </div>
    <div className="w-[25%]">
     <Music1/>
    </div>
    <ToastContainer position="top-right" />
  </div>
);

// Update other layouts to remove Music1/MusicHash if needed
const HomeLayout = () => (
  <div className="w-full flex">
    <div className="w-[65%]">
      <Home />
    </div>
    <div className="w-[35%] fixed top-0 right-0 min-h-screen h-full border-l">
      {/* Remove MusicHash */}
    </div>
  </div>
);

const NotificationLayout = () => (
  <div className="w-full flex">
    <div className="w-[74%] fixed top-0 left-0">
      <Notification />
    </div>
    <div className="w-[26%] fixed top-0 right-0 min-h-screen h-full border-l">
      {/* Remove MusicHash */}
    </div>
  </div>
);

const ProfileLayout = () => (
  <div className="flex w-full min-h-screen">
    <div className="w-[66%] border-r-2 h-screen overflow-hidden">
      <Profile />
    </div>
    <div className="w-[33%] overflow-y-auto px-4 py-6 h-screen">
      {/* Remove MusicHash */}
      <ToastContainer position="top-right" />
    </div>
  </div>
);

const AppLayout = () => (
  <div className="relative">
    <Outlet />
    <div className="fixed bottom-0 w-full">
      <Music1 /> {/* Render Music1 as a persistent bottom bar */}
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  { path: "/verifyaccount/:token", element: <VerifyAccount /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/explore", element: <Explore /> },
      { path: "/messages", element: <Messages /> },
      { path: "/music", element: <Music /> },
      { path: "/profile", element: <Profile /> },
      { path: "/friends", element: <Friends /> },
      { path: "/notifications", element: <Notification /> },
      { path: "/posts/:postID", element: <Posts/> },
      { path: "/users/:userID", element: <ProfileUser/> },
      // { path:"/comments/:postID", element: <CommentsPage /> },
      { path:"/comment/:commentID", element: <CommentsPage /> },
      { path: "/callback", element: <Callback/> },
   
     
    ],
  },
]);

const App = () => {
  return (

      <SpotifyPlayerProvider>
        <RouterProvider router={router} />
      </SpotifyPlayerProvider>

  );
};

export default App;
