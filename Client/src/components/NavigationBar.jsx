import { useEffect, useState } from "react";
import {
  Home,
  Search,
  Mail,
  Bell,
  Music2,
  User,
  Menu,
  Users,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrent, getRequests } from "../redux/UserSlice";
import axios from "axios";
import { toast } from "react-toastify";
import PostModal from "./PostModal";

export default function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  // Function to open the modal
  const openPostModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closePostModal = () => {
    setIsModalOpen(false);
  };

  const dispatch = useDispatch();
  const { UserInfo, Loading } = useSelector((state) => state.userdata);
  const navigate = useNavigate();
  const { FriendRequests } = useSelector((state) => state.userdata);

  const logout = async () => {
    try {
      const response = await axios.post(
        "api/logout",
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        toast.success("Logged Out");
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    dispatch(getCurrent());
    dispatch(getRequests());
  }, [dispatch]);

  // Get the count of pending friend requests
  const requestCount = FriendRequests
    ? FriendRequests.filter((request) => request.status === "pending").length
    : 0;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[80%] md:w-[25%] bg-white border-r p-6 flex flex-col justify-between z-[50] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:fixed md:flex pointer-events-auto`}
      >
        <div className="space-y-8 flex-1">
          <div className="flex justify-center mx-auto mb-4">
            <img
              className="w-auto h-16 sm:h-32"
              src="/images/Chibi1.png"
              alt="Logo"
            />
          </div>
          <nav className="flex flex-col items-center space-y-2 text-gray-800 pointer-events-auto">
            <Link
              to="/home"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<Home />} label="Home" />
            </Link>
            <Link
              to="/explore"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<Search />} label="Explore" />
            </Link>
            <Link
              to="/messages"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<Mail />} label="Messages" />
            </Link>
            <Link
              to="/notifications"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <div className="relative">
                <SidebarItem icon={<Bell />} label="Notifications" />
                {requestCount > 0 && (
                  <div className="w-7 h-7 rounded-2xl absolute top-1 right-1 bg-amber-600 flex items-center justify-center text-white text-xs">
                    {requestCount}
                  </div>
                )}
              </div>
            </Link>
            <Link
              to="/music"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<Music2 />} label="Music" />
            </Link>
            <Link
              to="/profile"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<User />} label="Profile" />
            </Link>
            <Link
              to="/friends"
              className="w-full pointer-events-auto"
              onClick={() => setIsOpen(false)}
            >
              <SidebarItem icon={<Users />} label="Friends" />
            </Link>
          </nav>
          {/* Post button that triggers the modal */}
          <div className="flex justify-center items-center">
            <button
              onClick={openPostModal} // Trigger modal on click
              className="w-1/2 h-12 bg-blue-600 text-white font-medium py-2 rounded-full hover:bg-blue-700 transition"
            >
              Post
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 hover:bg-gray-100 rounded-xl cursor-pointer">
          <div className="bg-gray-300 rounded-full h-12 w-10" />
          <div className="flex justify-between gap-12">
            <div className="w-[60%]">
              <p className="font-semibold">{UserInfo?.name || "User"}</p>
              <p className="text-sm text-gray-500">
                @{UserInfo?.name || "user"}
              </p>
            </div>
            <div className="w-[30%]">
              <button onClick={logout}>
                <SidebarItem icon={<LogOut />} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[40] md:hidden pointer-events-auto"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-[60] bg-white p-2 rounded-full shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6 text-blue-600" />
      </button>

      {/* Post Modal Component */}
      <PostModal isOpen={isModalOpen} onClose={closePostModal} />
    </>
  );
}

function SidebarItem({ icon, label, active }) {
  return (
    <div
      className={`flex items-center justify-center space-x-6 py-4 rounded-full cursor-pointer transition w-full ${
        active ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-100"
      } pointer-events-auto`}
    >
      <div className="w-6 h-6">{icon}</div>
      {label && <span>{label}</span>}
    </div>
  );
}