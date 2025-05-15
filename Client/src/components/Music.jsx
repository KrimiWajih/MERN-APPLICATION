import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlayIcon, PauseIcon, ArrowRightOnRectangleIcon, ArrowPathIcon, ForwardIcon, BackwardIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

export default function Music() {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);
  const [expires, setExpires] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isFetchingTracks, setIsFetchingTracks] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewTrack, setCurrentPreviewTrack] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef(null);
  const audioRef = useRef(new Audio());
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      getPlaylists();
      checkPremiumStatus();
    }
  }, [userData]);

  useEffect(() => {
    if (!isPremium || !userData || !localStorage.getItem('access_token')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token for Spotify Player');
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: 'MERN App Player',
        getOAuthToken: (cb) => cb(token),
        volume: volume,
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Player ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (state) {
          setIsPlaying(!state.paused);
          setProgress(state.position / state.duration);
          setCurrentTrackIndex(tracks.findIndex(item => item.track.uri === state.track_window.current_track.uri));
        }
      });

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Player initialization error:', message);
        toast.error(`Player initialization failed: ${message}`);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Player authentication error:', message);
        toast.error('Player authentication failed. Refreshing token...');
        handleRefreshToken();
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Player account error:', message);
        toast.error('Spotify Premium required for full playback');
        setIsPremium(false);
      });

      spotifyPlayer.connect().then((success) => {
        if (success) {
          console.log('Spotify Player connected');
        } else {
          console.error('Spotify Player failed to connect');
          toast.error('Failed to connect Spotify Player');
        }
      });

      setPlayer(spotifyPlayer);
      playerRef.current = spotifyPlayer;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isPremium, userData]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    const updateProgress = () => {
      if (audioRef.current.src && !audioRef.current.paused) {
        setProgress(audioRef.current.currentTime / audioRef.current.duration);
      }
    };
    progressIntervalRef.current = setInterval(updateProgress, 1000);
    return () => clearInterval(progressIntervalRef.current);
  }, [volume, isMuted]);

  const checkPremiumStatus = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const isPremiumAccount = response.data.product === 'premium';
      setIsPremium(isPremiumAccount);
      if (!isPremiumAccount) {
        console.log('Non-Premium account detected, using previews');
      }
    } catch (error) {
      console.error('Check premium status error:', error.response?.data || error.message);
      setIsPremium(false);
    }
  };

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/spotify/auth', {
        withCredentials: true,
      });
      console.log('Auth URL:', response.data.authUrl);
      localStorage.setItem('code_verifier', response.data.code_verifier);
      localStorage.setItem('state', response.data.state);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Spotify auth error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to initiate Spotify login');
      setIsLoading(false);
    }
  };

  const getUserData = async (retryCount = 0) => {
    const maxRetries = 2;
    try {
      const response = await axios.get('/api/spotify/me', {
        withCredentials: true,
      });
      setUserData(response.data);
      setExpiresIn(localStorage.getItem('expires_in') || 3600);
      setExpires(localStorage.getItem('expires') || new Date(Date.now() + 3600 * 1000));
    } catch (error) {
      console.error('Get user data error:', error.response?.data || error.message);
      if (error.response?.status === 401 && localStorage.getItem('refresh_token') && retryCount < maxRetries) {
        await handleRefreshToken();
        getUserData(retryCount + 1);
      } else {
        console.error('User data fetch failed, no refresh token or max retries reached');
        setUserData(null);
      }
    }
  };

  const getPlaylists = async () => {
    setIsFetchingPlaylists(true);
    try {
      const response = await axios.get('/api/spotify/playlists', {
        withCredentials: true,
      });
      const playlistsData = response.data.items || [];
      setPlaylists(playlistsData);
      console.log('=== Playlists ===', playlistsData);
    } catch (error) {
      console.error('Get playlists error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        handleRefreshToken();
      } else {
        toast.error('Failed to fetch playlists');
        setPlaylists([]);
      }
    } finally {
      setIsFetchingPlaylists(false);
    }
  };

  const getPlaylistTracks = async (playlistId) => {
    setIsFetchingTracks(true);
    try {
      const response = await axios.get(`/api/spotify/playlists/${playlistId}/tracks`, {
        withCredentials: true,
      });
      const tracksData = response.data.items || [];
      setTracks(tracksData);
      setSelectedPlaylist(playlistId);
      console.log(`=== Tracks for Playlist ID: ${playlistId} ===`, tracksData);
    } catch (error) {
      console.error('Get playlist tracks error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        handleRefreshToken();
      } else {
        toast.error('Failed to fetch playlist tracks');
        setTracks([]);
      }
    } finally {
      setIsFetchingTracks(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/spotify/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    }
    localStorage.removeItem('code_verifier');
    localStorage.removeItem('state');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('expires');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserData(null);
    setExpiresIn(null);
    setExpires(null);
    setPlaylists([]);
    setTracks([]);
    setSelectedPlaylist(null);
    setCurrentPreviewTrack(null);
    setCurrentTrackIndex(-1);
    setIsPremium(false);
    setProgress(0);
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.disconnect();
    }
    audioRef.current.pause();
    audioRef.current.src = '';
    toast.success('Logged out successfully');
  };

  const handleRefreshToken = async () => {
    try {
      const response = await axios.post('/api/spotify/refresh', {}, { withCredentials: true });
      const { expires_in, access_token, refresh_token } = response.data;
      localStorage.setItem('expires_in', expires_in);
      localStorage.setItem('expires', new Date(Date.now() + expires_in * 1000));
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token || localStorage.getItem('refresh_token'));
      setExpiresIn(expires_in);
      setExpires(new Date(Date.now() + expires_in * 1000));
      toast.success('Token refreshed successfully');
      getUserData();
      getPlaylists();
      if (selectedPlaylist) {
        getPlaylistTracks(selectedPlaylist);
      }
      if (playerRef.current && isPremium) {
        playerRef.current.disconnect();
        playerRef.current.connect();
      }
    } catch (error) {
      console.error('Refresh token error:', error.response?.data || error.message);
      handleLogout();
    }
  };

  const playTrack = async (track, index) => {
    setCurrentTrackIndex(index);
    if (!isPremium || !track.preview_url) {
      if (!track.preview_url) {
        toast.error('No preview available for this track');
        return;
      }
      audioRef.current.pause();
      audioRef.current.src = track.preview_url;
      audioRef.current.play().catch(() => toast.error('Failed to play preview'));
      setCurrentPreviewTrack(track.id);
      setIsPlaying(true);
      return;
    }

    if (!deviceId || !player) {
      toast.error('Player not ready. Try again.');
      return;
    }

    const expiresDate = new Date(localStorage.getItem('expires') || 0);
    if (expiresDate < new Date()) {
      await handleRefreshToken();
      return;
    }

    try {
      await axios.put(
        'https://api.spotify.com/v1/me/player/play',
        {
          uris: [track.uri],
          position_ms: 0,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          params: { device_id: deviceId },
        }
      );
      setIsPlaying(true);
      setCurrentPreviewTrack(null);
      audioRef.current.pause();
      audioRef.current.src = '';
    } catch (error) {
      console.error('Play track error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        handleRefreshToken();
      } else if (error.response?.status === 403) {
        toast.error('Spotify Premium required or insufficient permissions');
        setIsPremium(false);
      } else {
        toast.error('Failed to play track');
      }
    }
  };

  const togglePlayPause = async () => {
    if (isPremium) {
      if (!deviceId || !player) {
        toast.error('Player not ready.');
        return;
      }

      const expiresDate = new Date(localStorage.getItem('expires') || 0);
      if (expiresDate < new Date()) {
        await handleRefreshToken();
        return;
      }

      try {
        const endpoint = isPlaying
          ? 'https://api.spotify.com/v1/me/player/pause'
          : 'https://api.spotify.com/v1/me/player/play';
        await axios.put(endpoint, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          params: { device_id: deviceId },
        });
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Toggle play/pause error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          handleRefreshToken();
        } else if (error.response?.status === 403) {
          toast.error('Spotify Premium required or insufficient permissions');
          setIsPremium(false);
        } else {
          toast.error('Failed to toggle play/pause');
        }
      }
    } else {
      if (audioRef.current.src) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().catch(() => toast.error('Failed to play preview'));
          setIsPlaying(true);
        }
      } else {
        toast.error('No track selected for preview');
      }
    }
  };

  const playNextTrack = async () => {
    if (currentTrackIndex < tracks.length - 1) {
      const nextTrack = tracks[currentTrackIndex + 1].track;
      await playTrack(nextTrack, currentTrackIndex + 1);
    } else {
      toast.info('No next track in playlist');
    }
  };

  const playPreviousTrack = async () => {
    if (currentTrackIndex > 0) {
      const prevTrack = tracks[currentTrackIndex - 1].track;
      await playTrack(prevTrack, currentTrackIndex - 1);
    } else {
      toast.info('No previous track in playlist');
    }
  };

  const handleSeek = (e) => {
    const newProgress = e.target.value / 100;
    setProgress(newProgress);
    if (!isPremium) {
      audioRef.current.currentTime = newProgress * audioRef.current.duration;
    } else if (player && deviceId) {
      const positionMs = newProgress * tracks[currentTrackIndex]?.track.duration_ms;
      player.seek(positionMs).catch(() => toast.error('Failed to seek track'));
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (!isPremium) {
      audioRef.current.volume = newVolume;
    } else if (player) {
      player.setVolume(newVolume).catch(() => toast.error('Failed to set volume'));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isPremium) {
      audioRef.current.volume = isMuted ? volume : 0;
    } else if (player) {
      player.setVolume(isMuted ? volume : 0).catch(() => toast.error('Failed to set volume'));
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-white py-6 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 relative">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6">
            Connect Your Music
          </h2>
          {!userData ? (
            <div className="text-center">
              <p className="text-gray-600 mb-8">
                Link your Spotify account to access your music.
              </p>
              <button
                onClick={handleSpotifyLogin}
                disabled={isLoading}
                aria-label="Connect with Spotify"
                className="flex items-center justify-center w-full max-w-xs mx-auto py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transition duration-300 disabled:opacity-50"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm3.893 14.853c-.193.293-.586.406-.879.213-2.427-1.6-5.493-1.973-9.12-1.08-.34.08-.66-.12-.74-.46-.08-.34.12-.66.46-.74 3.986-.973 7.413-.533 10.186 1.28.293.193.406.586.213.879zm1.28-2.933c-.24.36-.733.493-1.093.253-2.773-1.84-7.013-2.373-10.266-1.28-.426.133-.866-.08-.999-.506-.133-.426.08-.866.506-.999 3.733-1.253 8.533-.667 11.693 1.413.36.24.493.733.253 1.093zm.12-3.013c-3.333-2.027-8.84-2.213-12.013-.613-.506.24-1.093.027-1.333-.48-.24-.506.027-1.093.48-1.333 3.667-1.867 9.733-1.627 13.613.773.426.266.586.853.32 1.28-.266.426-.853.586-1.28.32z" />
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Connect with Spotify'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome, {userData.display_name}!
                </p>
                {userData.images && userData.images[0] && (
                  <img
                    src={userData.images[0].url}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 border-2 border-green-500 shadow-md"
                  />
                )}
                <p className="text-gray-600 mb-2">
                  Email: {userData.email}
                </p>
                <p className="text-gray-600 mb-2">
                  Token expires: {expires ? new Date(expires).toLocaleString() : 'N/A'}
                </p>
                <p className="text-gray-600 mb-6">
                  Account: <span className={isPremium ? 'text-green-500' : 'text-yellow-500'}>{isPremium ? 'Premium' : 'Free (Previews Only)'}</span>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Your Playlists
                </h3>
                {isFetchingPlaylists ? (
                  <p className="text-gray-600 text-center">Loading playlists...</p>
                ) : playlists.length > 0 ? (
                  <ul className="space-y-3 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pr-4 scrollbar-gutter-stable">
                    {playlists.map((playlist) => (
                      <li
                        key={playlist.id}
                        onClick={() => getPlaylistTracks(playlist.id)}
                        className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:shadow-lg ${
                          selectedPlaylist === playlist.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gray-50'
                        } shadow-md`}
                      >
                        {playlist.images && playlist.images[0] ? (
                          <img
                            src={playlist.images[0].url}
                            alt={playlist.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${selectedPlaylist === playlist.id ? 'text-white' : 'text-gray-900'}`}>
                            {playlist.name}
                          </p>
                          <p className={`text-sm ${selectedPlaylist === playlist.id ? 'text-blue-100' : 'text-gray-600'}`}>
                            {playlist.tracks.total} tracks
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-center">No playlists found.</p>
                )}
              </div>
              {selectedPlaylist && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Tracks
                  </h3>
                  {isFetchingTracks ? (
                    <p className="text-gray-600 text-center">Loading tracks...</p>
                  ) : tracks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pr-4 scrollbar-gutter-stable">
                      {tracks.map((item, index) => (
                        <div
                          key={item.track.id}
                          onClick={() => playTrack(item.track, index)}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:shadow-lg ${
                            currentTrackIndex === index
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : 'bg-gray-50'
                          } shadow-md`}
                        >
                          {item.track.album.images && item.track.album.images[0] ? (
                            <img
                              src={item.track.album.images[0].url}
                              alt={item.track.name}
                              className="w-full h-32 rounded-lg object-cover mb-2"
                            />
                          ) : (
                            <div className="w-full h-32 rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                              <span className="text-gray-500">No Image</span>
                            </div>
                          )}
                          <p className={`font-medium text-sm truncate ${currentTrackIndex === index ? 'text-white' : 'text-gray-900'}`}>
                            {item.track.name}
                            {!isPremium && item.track.preview_url && (
                              <span className="text-xs text-gray-300"> (Preview)</span>
                            )}
                          </p>
                          <p className={`text-xs truncate ${currentTrackIndex === index ? 'text-green-100' : 'text-gray-600'}`}>
                            {item.track.artists.map((artist) => artist.name).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">No tracks found.</p>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleRefreshToken}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center justify-center"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Refresh Token
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition duration-300 flex items-center justify-center"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
          {currentTrackIndex >= 0 && (
            <div className="sticky rounded-2xl mt-4 bottom-0 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 shadow-lg z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {tracks[currentTrackIndex]?.track.album.images?.[0] ? (
                    <img
                      src={tracks[currentTrackIndex].track.album.images[0].url}
                      alt={tracks[currentTrackIndex].track.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tracks[currentTrackIndex]?.track.name}</p>
                    <p className="text-xs text-gray-300 truncate">
                      {tracks[currentTrackIndex]?.track.artists.map(artist => artist.name).join(', ')}
                      {!isPremium && tracks[currentTrackIndex]?.track.preview_url && (
                        <span className="ml-1">(Preview)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 w-full  sm:w-auto">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={playPreviousTrack}
                      disabled={currentTrackIndex <= 0}
                      className="p-2 rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      <BackwardIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      disabled={!isPremium && !audioRef.current.src}
                      className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                    >
                      {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                    </button>
                    <button
                      onClick={playNextTrack}
                      disabled={currentTrackIndex >= tracks.length - 1}
                      className="p-2 rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      <ForwardIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="w-full max-w-md flex items-center gap-2">
                    <span className="text-xs">{Math.floor(progress * (isPremium ? tracks[currentTrackIndex]?.track.duration_ms / 1000 : 30))}s</span>
                    <input
                      type="range"
                      value={progress * 100}
                      onChange={handleSeek}
                      className="flex-1 h-1 bg-gray-500 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#1DB954' }}
                    />
                    <span className="text-xs">{isPremium ? Math.floor(tracks[currentTrackIndex]?.track.duration_ms / 1000) : 30}s</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full hover:bg-gray-700 transition"
                  >
                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
                  </button>
                  <input
                    type="range"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-500 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#1DB954' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}