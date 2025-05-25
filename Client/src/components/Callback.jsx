import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Callback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      console.error('Spotify auth error:', error);
      toast.error(`Spotify authorization failed: ${error}`);
      setTimeout(() => navigate('/music'), 3000);
      return;
    }

    if (code && state) {
      const code_verifier = localStorage.getItem('code_verifier');
      const stored_state = localStorage.getItem('state');

      if (!code_verifier || state !== stored_state) {
        console.error('Invalid code_verifier or state');
        toast.error('Invalid authentication data');
        setTimeout(() => navigate('/music'), 3000);
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);

      axios
        .post(
          'https://mern-application-w42i.onrender.com/spotify/login',
          {
            code,
            code_verifier,
            redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
            state,
          },
          { withCredentials: true }
        )
        .then((response) => {
          localStorage.removeItem('code_verifier');
          localStorage.removeItem('state');
          localStorage.setItem('expires_in', response.data.expires_in);
          localStorage.setItem('expires', new Date(Date.now() + response.data.expires_in * 1000));
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          console.log('Token exchange successful:', response.data);
          toast.success('Spotify connected successfully');
          setTimeout(() => navigate('/home'), 3000);
        })
        .catch((error) => {
          console.error('Token exchange error:', error.response?.data || error.message);
          toast.error(`Failed to exchange token: ${error.response?.data?.message || error.message}`);
          setTimeout(() => navigate('/music'), 3000);
        });
    } else {
      console.error('Missing code or state in callback URL');
      toast.error('Invalid authorization response');
      setTimeout(() => navigate('/music'), 3000);
    }
  }, [location, navigate]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center text-lg">
      <p className="mb-4">Connecting to Spotify...</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to music page shortly.</p>
    </div>
  );
}
