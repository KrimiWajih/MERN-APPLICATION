import React, { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Provide default values to avoid Fast Refresh issues in Vite
export const SpotifyPlayerContext = createContext({
  player: null,
  deviceId: null,
  progress: 0,
  setProgress: () => {},
  isReady: false,
});

export const SpotifyPlayerProvider = ({ children }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load and initialize Spotify SDK
  useEffect(() => {
    console.log('Checking access token...');
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
    //  toast.error('Please log in to Spotify');
      return;
    }

    console.log('Loading Spotify SDK script...');
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load SDK script');
      toast.error('Failed to load Spotify SDK');
    };
    document.body.appendChild(script);

    const handleSDKReady = () => {
      console.log('Spotify SDK ready');
      const spotifyPlayer = new window.Spotify.Player({
        name: 'MERN App Player',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Player ready, Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        toast.success('Spotify Player Ready');
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Player not ready, Device ID:', device_id);
        setDeviceId(null);
        setIsReady(false);
        toast.error('Spotify Player Disconnected');
      });

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        toast.error(`Spotify Init Failed: ${message}`);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        toast.error(`Spotify Auth Failed: ${message}`);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        toast.error(`Spotify Account Error: ${message}`);
      });

      spotifyPlayer.connect().then((success) => {
        console.log('Connect attempt:', success ? 'Success' : 'Failed');
        if (success) setPlayer(spotifyPlayer);
      });
    };

    window.onSpotifyWebPlaybackSDKReady = handleSDKReady;

    // Cleanup on unmount
    return () => {
      if (player) player.disconnect();
      document.body.removeChild(script);
    };
  }, []);

  // Monitor player state and update progress
  useEffect(() => {
    if (!player || !isReady) return;

    const updateProgress = async () => {
      const state = await player.getCurrentState();
      if (!state) {
        console.log('No active playback state');
        return;
      }

      const { position, duration } = state;
      setProgress(duration ? position / duration : 0);
    };

    // Initial check
    updateProgress();

    // Poll every second for progress updates
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval); // Cleanup
  }, [player, isReady]);

  return (
    <SpotifyPlayerContext.Provider
      value={{ player, deviceId, progress, setProgress, isReady }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
};
