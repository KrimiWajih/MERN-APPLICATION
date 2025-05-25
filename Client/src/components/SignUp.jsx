import axios from "axios";
import React, { useRef } from "react";
import { Link, useNavigate, useRevalidator } from "react-router-dom";
import { toast } from "react-toastify";

export default function Signup() {
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();
  const emailref = useRef();
  const passref = useRef();
  const nameref = useRef();
  const usernameref = useRef();

  const handlesignup = async (event) => {
    event.preventDefault();
    if (!emailref.current.value || !passref.current.value || !nameref.current.value || !usernameref.current.value) {
      toast.error("Please fill all fields");
      return;
    }
    const newUser = {
      username: usernameref.current.value,
      name: nameref.current.value,
      email: emailref.current.value,
      password: passref.current.value,
    };
    console.log("New user:", newUser);
    try {
      const response = await axios.post(
        `https://mern-application-w42i.onrender.com/signup`,
        newUser,
        {
          withCredentials: true,
        }
      );
      console.log("Signup response:", response.data);
      toast.success("Verify your email", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
      });
      revalidate();
      // Delay redirect to ensure toast is visible
      setTimeout(() => {
        navigate("/");
      }, 3500); // Wait 3.5 seconds to match toast duration
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 400) {
          toast.error(error.response.data.Msg || "Invalid input or user already exists");
        } else if (error.response.status === 500) {
          toast.error(error.response.data.Msg || "Server error");
        } else {
          toast.error("Failed to sign up");
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
              className="w-auto h-16 sm:h-32"
              src="/images/Chibi1.png"
              alt="Logo"
            />
          </div>

          <p className="text-xl text-center text-gray-600 dark:text-gray-200">
            Create an account
          </p>

          <form className="mt-6" onSubmit={handlesignup}>
            {/* Name */}
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <input
                type="text"
                ref={nameref}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            {/* Username */}
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Username
              </label>
              <input
                type="text"
                ref={usernameref}
                required
                placeholder="johndoe123"
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Email Address
              </label>
              <input
                type="email"
                ref={emailref}
                required
                placeholder="email@example.com"
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-200">
                Password
              </label>
              <input
                type="password"
                ref={passref}
                required
                placeholder="********"
                className="w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                Sign Up
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between mt-4">
            <span className="w-1/5 border-b dark:border-gray-600" />
            <Link
              to={"/"}
              className="text-xs text-gray-500 uppercase dark:text-gray-400 hover:underline"
            >
              Already have an account?
            </Link>
            <span className="w-1/5 border-b dark:border-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
