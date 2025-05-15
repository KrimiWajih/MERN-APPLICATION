import { configureStore } from "@reduxjs/toolkit";
import { UserReducer } from "./UserSlice";
import { spotifyReducer } from "./spotifySlice";


export const store = configureStore(
  {
    reducer : {userdata : UserReducer ,  spotify: spotifyReducer}
  }
)