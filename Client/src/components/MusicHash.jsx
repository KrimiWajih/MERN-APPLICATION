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

export default function MusicHash() {
  const [isOpen, setIsOpen] = useState(false);
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
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-screen w-[80%] md:w-[25%] bg-white border-l p-6 flex flex-col justify-between z-[50] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:fixed md:flex pointer-events-auto`}
      >
       
      
      </aside>

  
    </>
  );
}

