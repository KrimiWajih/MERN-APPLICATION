// spotifySlice.js
import { createSlice } from '@reduxjs/toolkit';

const spotifySlice = createSlice({
  name: 'spotify',
  initialState: {
    currentTrackIndex: -1,
    selectedPlaylist: null,
    tracks: [],
    isPlaying: false,
  },
  reducers: {
    setCurrentTrackIndex(state, action) {
      state.currentTrackIndex = action.payload;
    },
    setSelectedPlaylist(state, action) {
      state.selectedPlaylist = action.payload;
    },
    setTracks(state, action) {
      state.tracks = action.payload;
    },
    setIsPlaying(state, action) {
      state.isPlaying = action.payload;
    },
  },
});

export const { setCurrentTrackIndex, setSelectedPlaylist, setTracks, setIsPlaying } = spotifySlice.actions;
export const spotifyReducer = spotifySlice.reducer;