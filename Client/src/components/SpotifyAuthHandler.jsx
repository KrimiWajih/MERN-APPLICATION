import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function SpotifyAuthHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get("code");
    if (!code) return;

    axios.post("api/spotify/callback", {
      code,
      redirectUri: "http://localhost:5173/spotify-auth",
    })
    .then((res) => {
      // Handle login success
      console.log(res.data);
      navigate("/"); // or go to profile/dashboard
    })
    .catch((err) => {
      console.error("Spotify login failed:", err);
    });
  }, [params, navigate]);

  return <p>Logging you in with Spotify...</p>;
}
