import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function VerifyAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`api/verifyaccount/${token}`);
        toast.success("Successfully Verified!");
        setMessage("Successfully Verified.");
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        toast.error("Verification failed.");
        setMessage("Verification failed. Invalid or expired token.");
      }
    };

    if (token) verify();
  }, [token, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className={`text-center text-xl ${message.includes("Verified") ? "text-green-600" : "text-red-600"}`}>
        {message}
      </div>
    </div>
  );
}

export default VerifyAccount;
