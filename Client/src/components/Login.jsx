import axios from "axios";
import React, { useRef } from "react";
import { Link, Navigate, useNavigate, useRevalidator } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();

  const emailref = useRef();
  const passref = useRef();
  const handlelogin = async (event) => {
    event.preventDefault();
    if (!emailref.current.value || !passref.current.value) {
      toast.error("Please fill the form");
      return;
    }
    const newUser = {
      email: emailref.current.value,
      password: passref.current.value,
    };
    console.log(newUser);
    try {
      const response = await axios.post(
        'https://mern-application-w42i.onrender.com/signin', // Use proxied endpoint
        newUser,
        {
          withCredentials: true,
        }
      );
  
      console.log("Login response:", response);
      toast.success("Logged in successfully");
      navigate("/home");
      revalidate();
    } catch (error) {
      if (error.response) {
        console.log(error);
        if (error.response.status === 400) {
          toast.error("User not found");
        } else if (error.response.status === 500) {
          toast.error(error.response.data.Msg || "Wrong Password");
        } else {
          toast.error("Failed to login");
        }
      } else {
        toast.error("Server not reachable");
      }
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        {/* Left Side Image */}
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1606660265514-358ebbadc80d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1575&q=80")',
          }}
        />

        {/* Right Side Form */}
        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <div className="flex justify-center mx-auto mb-4">
            <img
              className="w-auto h-16 sm:h-32 "
              src="/images/Chibi1.png"
              alt="Logo"
            />
          </div>

          <p className="text-xl text-center text-gray-600 dark:text-gray-200">
            Welcome to TuneSphere
          </p>
          {/* Google Sign In */}
          <button className="flex items-center justify-center mt-4 w-full text-gray-600 transition duration-300 transform border rounded-lg dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="px-4 py-2">
              {" "}
              <svg className="w-6 h-6" viewBox="0 0 40 40">
                {" "}
                <path
                  d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
                  fill="#FFC107"
                />{" "}
                <path
                  d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z"
                  fill="#FF3D00"
                />{" "}
                <path
                  d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z"
                  fill="#4CAF50"
                />{" "}
                <path
                  d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
                  fill="#1976D2"
                />{" "}
              </svg>{" "}
            </div>
            <span className="w-5/6 px-4 py-3 font-bold text-center">
              Sign in with Google
            </span>
          </button>

          {/* Email login */}
          <div className="flex items-center justify-between mt-6">
            <span className="w-1/5 border-b dark:border-gray-600" />
            <span className="text-xs text-gray-500 uppercase dark:text-gray-400">
              or login with email
            </span>
            <span className="w-1/5 border-b dark:border-gray-600" />
          </div>

          <form onSubmit={(e)=>handlelogin(e)}>
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Email Address
              </label>
              <input
                type="email"
                ref={emailref}
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Password
              </label>
              <input
                type="password"
                ref={passref}
                required
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white transition bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between mt-4">
            <span className="w-1/5 border-b dark:border-gray-600" />
            <Link
              to={"/signup"}
              className="text-xs text-gray-500 uppercase dark:text-gray-400 hover:underline"
            >
              or sign up
            </Link>
            <span className="w-1/5 border-b dark:border-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
