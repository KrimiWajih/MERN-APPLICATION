import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentTrackIndex, setSelectedPlaylist, setTracks, setIsPlaying } from '../redux/spotifySlice';
import { SpotifyPlayerContext } from './SpotifyPlayerContext';
import {
  PlayIcon,
  PauseIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from '@heroicons/react/24/solid';
import { getAllUsers } from '../redux/UserSlice';

export default function Music1() {
  const { player, deviceId, progress, setProgress, isReady } = useContext(SpotifyPlayerContext);
  const { AllUsers, UserInfo, error } = useSelector((state) => state.userdata);
  const { currentTrackIndex, selectedPlaylist, tracks, isPlaying } = useSelector((state) => state.spotify);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false);
  const [isFetchingTracks, setIsFetchingTracks] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch AllUsers if not already loaded
  useEffect(() => {
    if (!AllUsers || AllUsers.length === 0) {
      dispatch(getAllUsers());
    }
  }, [dispatch, AllUsers]);

  // Log AllUsers for debugging
  useEffect(() => {
    console.log('AllUsers:', AllUsers);
  }, [AllUsers]);

  // Validate session and fetch user data
  useEffect(() => {
    const validateSession = async () => {
      setIsAuthLoading(true);
      const expires = new Date(localStorage.getItem('expires') || 0);
      if (!localStorage.getItem('access_token')) {
        console.log('No access token found.');
        setUserData(null);
        setIsAuthLoading(false);
        return;
      }
      if (expires < Date.now() && localStorage.getItem('refresh_token')) {
        await handleRefreshToken();
      }
      await getUserData();
      setIsAuthLoading(false);
    };
    validateSession();
  }, []);

  // Handle Spotify user data and playlists
  useEffect(() => {
    if (userData) {
      getPlaylists();
      checkPremiumStatus();
    }
  }, [userData]);

  // Player state change handler
  useEffect(() => {
    if (!player || !isPremium) return;

    const handleStateChange = async (state) => {
      if (!state) {
        dispatch(setIsPlaying(false));
        console.log('Player state is null, playback stopped');
        return;
      }
      const { position, duration, paused, track_window, context } = state;
      setProgress(duration ? position / duration : 0);
      dispatch(setIsPlaying(!paused));

      const currentTrackId = track_window.current_track.id;
      const newIndex = tracks.findIndex((item) => item.track.id === currentTrackId);
      if (newIndex !== -1 && newIndex !== currentTrackIndex) {
        dispatch(setCurrentTrackIndex(newIndex));
      }

      console.log('Playback context:', context.uri, 'Current track ID:', currentTrackId, 'Position:', position, 'Duration:', duration);

      if (position >= duration - 300 && newIndex === tracks.length - 1 && tracks.length > 0) {
        console.log('Last track nearing end, preparing to loop');
        try {
          await axios.put(
            'https://api.spotify.com/v1/me/player/pause',
            {},
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
              params: { device_id: deviceId },
            }
          );
          console.log('Player paused to clear queue');
          setTimeout(() => {
            if (isPremium && deviceId && isReady && tracks.length > 0) {
              console.log('Looping to first track');
              playTrack(tracks[0].track, 0);
            } else {
              console.log('Looping aborted: Premium:', isPremium, 'Device ID:', deviceId, 'Ready:', isReady, 'Tracks:', tracks.length);
            }
          }, 500);
        } catch (error) {
          console.error('Error pausing player before looping:', error.response?.data || error.message);
          toast.error('Failed to loop playlist');
        }
      }

      if (newIndex === -1 && tracks.length > 0 && isPlaying) {
        console.log('Non-playlist track detected:', track_window.current_track.name, track_window.current_track.id);
        try {
          await axios.put(
            'https://api.spotify.com/v1/me/player/pause',
            {},
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
              params: { device_id: deviceId },
            }
          );
          console.log('Paused non-playlist track');
          setTimeout(() => {
            if (isPremium && deviceId && isReady && tracks.length > 0) {
              console.log('Looping to first track after non-playlist track');
              playTrack(tracks[0].track, 0);
            }
          }, 500);
        } catch (error) {
          console.error('Error handling non-playlist track:', error.response?.data || error.message);
          toast.error('Failed to loop playlist');
        }
      }
    };

    player.addListener('player_state_changed', handleStateChange);
    return () => player.removeListener('player_state_changed', handleStateChange);
  }, [player, isPremium, dispatch, setProgress, tracks, currentTrackIndex, deviceId, isReady]);

  const checkPremiumStatus = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const isPremiumAccount = response.data.product === 'premium';
      setIsPremium(isPremiumAccount);
      if (!isPremiumAccount) {
        toast.error('Spotify Premium required');
      }
    } catch (error) {
      console.error('Check premium status error:', error.response?.data || error.message);
      setIsPremium(false);
      toast.error('Failed to verify premium status');
    }
  };

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://mern-application-w42i.onrender.com/spotify/auth', { withCredentials: true });
      localStorage.setItem('code_verifier', response.data.code_verifier);
      localStorage.setItem('state', response.data.state);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Spotify auth error:', error.response?.data || error.message);
      toast.error('Failed to initiate Spotify login');
      setIsLoading(false);
    }
  };

  const getUserData = async (retryCount = 0) => {
    const maxRetries = 2;
    try {
      const response = await axios.get('https://mern-application-w42i.onrender.com/spotify/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        withCredentials: true,
      });
      console.log('User data fetched:', response.data);
      setUserData(response.data);
    } catch (error) {
      console.error('Get user data error:', error.response?.data || error.message);
      if (error.response?.status === 401 && localStorage.getItem('refresh_token') && retryCount < maxRetries) {
        console.log('401 error, attempting to refresh token...');
        await handleRefreshToken();
        getUserData(retryCount + 1);
      } else {
        console.error('Failed to fetch user data after retries or no refresh token.');
        toast.error('Session expired. Please log in again.');
        setUserData(null);
      }
    }
  };

  const getPlaylists = async () => {
    setIsFetchingPlaylists(true);
    try {
      const response = await axios.get('https://mern-application-w42i.onrender.com/spotify/playlists', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        withCredentials: true,
      });
      setPlaylists(response.data.items || []);
    } catch (error) {
      console.error('Get playlists error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        await handleRefreshToken();
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
      const response = await axios.get(`https://mern-application-w42i.onrender.com/spotify/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        withCredentials: true,
      });
      dispatch(setTracks(response.data.items || []));
      dispatch(setSelectedPlaylist(playlistId));
    } catch (error) {
      console.error('Get playlist tracks error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        await handleRefreshToken();
      } else {
        toast.error('Failed to fetch playlist tracks');
        dispatch(setTracks([]));
      }
    } finally {
      setIsFetchingTracks(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      console.log('Refreshing token with refresh_token:', localStorage.getItem('refresh_token')?.slice(0, 10) + '...');
      const response = await axios.post(
        'https://mern-application-w42i.onrender.com/spotify/refresh',
        { refresh_token: localStorage.getItem('refresh_token') },
        { withCredentials: true }
      );
      const { expires_in, access_token, refresh_token } = response.data;
      localStorage.setItem('expires_in', expires_in);
      localStorage.setItem('expires', new Date(Date.now() + expires_in * 1000));
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token || localStorage.getItem('refresh_token'));
      console.log('Token refreshed successfully:', { expires_in, access_token: access_token.slice(0, 10) + '...' });
      toast.success('Token refreshed successfully');
      await getUserData();
      await getPlaylists();
      if (selectedPlaylist) {
        await getPlaylistTracks(selectedPlaylist);
      }
    } catch (error) {
      console.error('Refresh token error:', error.response?.data || error.message);
      toast.error('Failed to refresh session. Please log in again.');
      await handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('https://mern-application-w42i.onrender.com/spotify/logout', {}, { withCredentials: true });
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('state');
      localStorage.removeItem('expires_in');
      localStorage.removeItem('expires');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUserData(null);
      setPlaylists([]);
      dispatch(setTracks([]));
      dispatch(setSelectedPlaylist(null));
      dispatch(setCurrentTrackIndex(-1));
      setIsPremium(false);
      setProgress(0);
      dispatch(setIsPlaying(false));
      toast.success('Logged out successfully');
      navigate('/home');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      toast.error('Failed to logout');
    }
  };

  const handleShareTrack = async () => {
    if (!UserInfo?._id) {
      toast.error('Please log in to share a track');
      return;
    }

    if (currentTrackIndex < 0 || !tracks[currentTrackIndex]) {
      toast.error('No track selected to share');
      return;
    }

    const track = tracks[currentTrackIndex].track;
    const postContent = `${UserInfo.name} is listening to ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;
    const mediaUrl = track.album.images?.[0]?.url || '';

    try {
      const response = await axios.post(
        'https://mern-application-w42i.onrender.com/addpost',
        {
          content: postContent,
          userID: UserInfo._id,
          media: [mediaUrl],
        },
        { withCredentials: true }
      );
      toast.success('Track shared successfully!');
      console.log('Post created:', response.data);
    } catch (error) {
      console.error('Error sharing track:', error.response?.data || error.message);
      toast.error('Failed to share track');
    }
  };

  const playTrack = async (track, index) => {
    if (!isPremium) {
      toast.error('Spotify Premium required');
      return;
    }

    if (!deviceId || !player || !isReady) {
      toast.error('Player not ready. Please wait or refresh.');
      return;
    }

    const expiresDate = new Date(localStorage.getItem('expires') || 0);
    if (expiresDate < Date.now()) {
      await handleRefreshToken();
      return;
    }

    try {
      dispatch(setCurrentTrackIndex(index));

      await axios.put(
        'https://api.spotify.com/v1/me/player/play',
        {
          context_uri: `spotify:playlist:${selectedPlaylist}`,
          offset: { position: index },
          position_ms: 0,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          params: { device_id: deviceId },
        }
      );
      dispatch(setIsPlaying(true));
      console.log('Playlist started with track:', track.name, 'Index:', index);
    } catch (error) {
      console.error('Play track error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        toast.error('No active device found. Refreshing token...');
        await handleRefreshToken();
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Refreshing token...');
        await handleRefreshToken();
      } else if (error.response?.status === 403) {
        toast.error('Spotify Premium required or insufficient permissions');
        setIsPremium(false);
      } else {
        toast.error(`Failed to play track: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!isPremium) {
      toast.error('Spotify Premium required');
      return;
    }

    if (!deviceId || !player || !isReady) {
      toast.error('Player not ready.');
      return;
    }

    const expiresDate = new Date(localStorage.getItem('expires') || 0);
    if (expiresDate < Date.now()) {
      await handleRefreshToken();
      return;
    }

    try {
      const endpoint = isPlaying
        ? 'https://api.spotify.com/v1/me/player/pause'
        : 'https://api.spotify.com/v1/me/player/play';
      await axios.put(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          params: { device_id: deviceId },
        }
      );
      dispatch(setIsPlaying(!isPlaying));
    } catch (error) {
      console.error('Toggle play/pause error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        toast.error('No active device found. Refreshing token...');
        await handleRefreshToken();
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Refreshing token...');
        await handleRefreshToken();
      } else if (error.response?.status === 403) {
        toast.error('Spotify Premium required or insufficient permissions');
        setIsPremium(false);
      } else {
        toast.error('Failed to toggle play/pause');
      }
    }
  };

  const playNextTrack = async () => {
    if (!isPremium) {
      toast.error('Spotify Premium required');
      return;
    }

    if (!deviceId || !player || !isReady) {
      toast.error('Player not ready.');
      return;
    }

    const expiresDate = new Date(localStorage.getItem('expires') || 0);
    if (expiresDate < Date.now()) {
      await handleRefreshToken();
      return;
    }

    try {
      if (currentTrackIndex >= tracks.length - 1) {
        await playTrack(tracks[0].track, 0);
      } else {
        await player.nextTrack();
        dispatch(setCurrentTrackIndex(currentTrackIndex + 1));
        dispatch(setIsPlaying(true));
      }
    } catch (error) {
      console.error('Next track error:', error.response?.data || error.message);
      toast.error('Failed to play next track');
    }
  };

  const playPreviousTrack = async () => {
    if (!isPremium) {
      toast.error('Spotify Premium required');
      return;
    }

    if (currentTrackIndex <= 0) {
      toast.info('No previous track in playlist');
      return;
    }

    try {
      await player.previousTrack();
      dispatch(setCurrentTrackIndex(currentTrackIndex - 1));
      dispatch(setIsPlaying(true));
    } catch (error) {
      console.error('Previous track error:', error.response?.data || error.message);
      toast.error('Failed to play previous track');
    }
  };

  const handleSeek = (e) => {
    const newProgress = e.target.value / 100;
    setProgress(newProgress);
    if (isPremium && player && deviceId && tracks[currentTrackIndex]?.track.duration_ms) {
      const positionMs = newProgress * tracks[currentTrackIndex].track.duration_ms;
      player.seek(positionMs).catch(() => toast.error('Failed to seek track'));
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (isPremium && player) {
      player.setVolume(newVolume).catch(() => toast.error('Failed to set volume'));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isPremium && player) {
      player.setVolume(isMuted ? volume : 0).catch(() => toast.error('Failed to set volume'));
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
    setSearchQuery('');
  };

  // Filter users based on search query
  const filteredUsers = Array.isArray(AllUsers)
    ? AllUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="h-full flex flex-col bg-white py-4 px-3">
      {isAuthLoading ? (
        <div className="w-full h-screen flex flex-col items-center justify-center text-center text-lg">
          <p className="mb-4">Authenticating...</p>
          <p className="text-sm text-gray-500">Please wait while we connect to Spotify.</p>
        </div>
      ) : (
        <>
          {/* Search Section */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 max-h-[20vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {filteredUsers.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredUsers.map((user) => (
                      <li
                        key={user._id}
                        onClick={() => handleUserClick(user._id)}
                        className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                      >
                        <img
                          src={user.profilepic}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No users found.</p>
                )}
              </div>
            )}
          </div>

          {/* Player Section */}
          <div className="w-full bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-2xl p-3 shadow-lg mb-4">
            {currentTrackIndex >= 0 && tracks[currentTrackIndex] ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {tracks[currentTrackIndex]?.track.album.images?.[0] ? (
                    <img
                      src={tracks[currentTrackIndex].track.album.images[0].url}
                      alt={tracks[currentTrackIndex].track.name}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tracks[currentTrackIndex]?.track.name}</p>
                    <p className="text-xs text-gray-300 truncate">
                      {tracks[currentTrackIndex]?.track.artists.map((artist) => artist.name).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={handleShareTrack}
                    className="p-1 rounded-full hover:bg-gray-700 transition"
                    title="Share this track"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playPreviousTrack}
                    disabled={currentTrackIndex <= 0}
                    className="p-1 rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={togglePlayPause}
                    disabled={!isPremium}
                    className="p-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                  >
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={playNextTrack}
                    className="p-1 rounded-full hover:bg-gray-700 transition"
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {formatTime(progress * (tracks[currentTrackIndex]?.track.duration_ms / 1000))}
                  </span>
                  <input
                    type="range"
                    value={progress * 100}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-500 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#1DB954' }}
                  />
                  <span className="text-xs">
                    -{formatTime((1 - progress) * (tracks[currentTrackIndex]?.track.duration_ms / 1000))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded-full hover:bg-gray-700 transition"
                  >
                    {isMuted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-500 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#1DB954' }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center">No track selected</p>
            )}
          </div>

          {/* Playlists and Other Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {!deviceId && userData && isPremium && (
              <div className="text-center text-red-500 mb-4">
                Player not ready. Please try refreshing or logging in again.
                <button onClick={handleRefreshToken} className="ml-2 text-blue-500 underline">
                  Refresh Token
                </button>
              </div>
            )}
            {!userData ? (
              <div className="text-center">
                <button
                  onClick={handleSpotifyLogin}
                  disabled={isLoading}
                  className="w-full py-2 px-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm3.893 14.853c-.193.293-.586.406-.879.213-2.427-1.6-5.493-1.973-9.12-1.08-.34.08-.66-.12-.74-.46-.08-.34.12-.66.46-.74 3.986-.973 7.413-.533 10.186 1.28.293.193.406.586.213.879zm1.28-2.933c-.24.36-.733.493-1.093.253-2.773-1.84-7.013-2.373-10.266-1.28-.426.133-.866-.08-.999-.506-.133-.426.08-.866.506-.999 3.733-1.253 8.533-.667 11.693 1.413.36.24.493.733.253 1.093zm.12-3.013c-3.333-2.027-8.84-2.213-12.013-.613-.506.24-1.093.027-1.333-.48-.24-.506.027-1.093.48-1.333 3.667-1.867 9.733-1.627 13.613.773.426.266.586.853.32 1.28-.266.426-.853.586-1.28.32z" />
                  </svg>
                  {isLoading ? 'Connecting...' : 'Connect Spotify'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{userData.display_name}</p>
                  {userData.images?.[0] && (
                    <img
                      src={userData.images[0].url}
                      alt="Profile"
                      className="w-12 h-12 rounded-full mx-auto mt-2 border-2 border-green-500"
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">{userData.email}</p>
                  <p className="text-sm text-gray-600">
                    Account: <span className={isPremium ? 'text-green-500' : 'text-yellow-500'}>{isPremium ? 'Premium' : 'Free'}</span>
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-900">Playlists</h3>
                  {isFetchingPlaylists ? (
                    <p className="text-gray-600 text-sm">Loading playlists...</p>
                  ) : playlists.length > 0 ? (
                    <ul className="space-y-2 mt-2 max-h-[30vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      {playlists.map((playlist) => (
                        <li
                          key={playlist.id}
                          onClick={() => getPlaylistTracks(playlist.id)}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                            selectedPlaylist === playlist.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          {playlist.images?.[0] ? (
                            <img
                              src={playlist.images[0].url}
                              alt={playlist.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">{playlist.name}</p>
                            <p className="text-xs text-gray-600">{playlist.tracks.total} tracks</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">No playlists found.</p>
                  )}
                </div>
                {selectedPlaylist && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Tracks</h3>
                    {isFetchingTracks ? (
                      <p className="text-gray-600 text-sm">Loading tracks...</p>
                    ) : tracks.length > 0 ? (
                      <ul className="space-y-2 mt-2 max-h-[30vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                        {tracks.map((item, index) => (
                          <li
                            key={item.track.id}
                            onClick={() => playTrack(item.track, index)}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                              currentTrackIndex === index ? 'bg-green-100' : ''
                            }`}
                          >
                            {item.track.album.images?.[0] ? (
                              <img
                                src={item.track.album.images[0].url}
                                alt={item.track.name}
                                className="w-10 h-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No Image</span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">{item.track.name}</p>
                              <p className="text-xs text-gray-600 truncate">
                                {item.track.artists.map((artist) => artist.name).join(', ')}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 text-sm">No tracks found.</p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRefreshToken}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
                  >
                    <ArrowPathIcon className="w-5 h-5 inline mr-2" />
                    Refresh Token
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 inline mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
