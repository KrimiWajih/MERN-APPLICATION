const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const { connectDB } = require('./configuration/DBConnect');
const URouter = require('./router/Router');
const http = require('http');
const initialization = require('./socket');

dotenv.config();
connectDB();

const authSessions = new Map();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://localhost:5173',
      'https://mern-application-1-fozj.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const scope =
  'user-read-private user-read-email streaming user-read-playback-state playlist-read-private playlist-read-collaborative user-modify-playback-state';

// Spotify routes
app.get('/spotify/me', async (req, res) => {
  const access_token = req.cookies.access_token || req.headers.authorization?.split('Bearer ')[1];
  if (!access_token) {
    console.error('No access token provided in cookies or Authorization header');
    return res.status(401).json({ error: 'No access token' });
  }
  console.log('Fetching /spotify/me with access_token:', access_token.slice(0, 10) + '...');
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await response.json();
    if (data.error) {
      console.error('Spotify /me error:', data.error);
      return res.status(data.error.status || 400).json(data);
    }
    console.log('Spotify /me success:', data.display_name);
    res.json(data);
  } catch (err) {
    console.error('Spotify /me error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.get('/spotify/playlists', async (req, res) => {
  const access_token = req.cookies.access_token || req.headers.authorization?.split('Bearer ')[1];
  if (!access_token) {
    console.error('No access token provided for /spotify/playlists');
    return res.status(401).json({ error: 'No access token' });
  }
  console.log('Fetching /spotify/playlists with access_token:', access_token.slice(0, 10) + '...');
  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const data = await response.json();
    if (data.error) {
      console.error('Spotify playlists error:', data.error);
      return res.status(data.error.status || 400).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error('Spotify playlists error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

app.get('/spotify/playlists/:id/tracks', async (req, res) => {
  const access_token = req.cookies.access_token || req.headers.authorization?.split('Bearer ')[1];
  const playlistId = req.params.id;
  if (!access_token) {
    console.error('No access token provided for /spotify/playlists/:id/tracks');
    return res.status(401).json({ error: 'No access token' });
  }
  console.log('Fetching /spotify/playlists/:id/tracks with access_token:', access_token.slice(0, 10) + '...');
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const data = await response.json();
    if (data.error) {
      console.error('Spotify playlist tracks error:', data.error);
      return res.status(data.error.status || 400).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error('Spotify playlist tracks error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

app.get('/spotify/auth', (req, res) => {
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.randomBytes(length))
      .map((x) => possible[x % possible.length])
      .join('');
  };

  const base64urlEncode = (buffer) => {
    return buffer
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const state = generateRandomString(16);
  const code_verifier = generateRandomString(64);
  const hashed = crypto.createHash('sha256').update(code_verifier).digest();
  const code_challenge = base64urlEncode(hashed);

  authSessions.set(state, {
    code_verifier,
    expires: Date.now() + 10 * 60 * 1000,
  });

  const authUrl = new URL(SPOTIFY_AUTH_URL);
  const params = {
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    scope: scope,
    code_challenge_method: 'S256',
    code_challenge: code_challenge,
    redirect_uri: process.env.REDIRECT_URI,
    state: state,
  };

  authUrl.search = new URLSearchParams(params).toString();
  console.log('Generated auth URL:', authUrl.toString());
  res.json({ authUrl: authUrl.toString(), code_verifier, state });
});

app.post('/spotify/login', async (req, res) => {
  const { code, code_verifier, redirect_uri, state } = req.body;
  if (!code || !code_verifier || !redirect_uri || !state) {
    console.error('Missing parameters in /spotify/login:', { code, code_verifier, redirect_uri, state });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const session = authSessions.get(state);
  if (!session || session.expires < Date.now()) {
    authSessions.delete(state);
    console.error('Invalid or expired state:', state);
    return res.status(400).json({ message: 'Invalid or expired state' });
  }

  if (session.code_verifier !== code_verifier) {
    authSessions.delete(state);
    console.error('Invalid code_verifier for state:', state);
    return res.status(400).json({ message: 'Invalid code_verifier' });
  }

  authSessions.delete(state);

  const params = new URLSearchParams();
  params.append('client_id', process.env.CLIENT_ID);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);
  params.append('code_verifier', code_verifier);

  console.log('Token exchange request:', params.toString());

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (data.error) {
      console.error('Spotify token exchange error:', data.error);
      return res.status(400).json(data);
    }
    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: data.expires_in * 1000,
    });
    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    console.log('Token exchange successful:', {
      access_token: data.access_token.slice(0, 10) + '...',
      refresh_token: data.refresh_token.slice(0, 10) + '...',
      expires_in: data.expires_in,
    });
    res.json({
      expires_in: data.expires_in,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  } catch (err) {
    console.error('Token exchange error:', err.message, err.stack);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.post('/spotify/refresh', async (req, res) => {
  const refresh_token = req.body.refresh_token || req.cookies.refresh_token;
  if (!refresh_token) {
    console.error('Missing refresh_token in /spotify/refresh');
    return res.status(400).json({ message: 'Missing refresh_token' });
  }
  console.log('Refreshing token with refresh_token:', refresh_token.slice(0, 10) + '...');
  const params = new URLSearchParams();
  params.append('client_id', process.env.CLIENT_ID);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refresh_token);
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (data.error) {
      console.error('Spotify refresh error:', data.error);
      return res.status(400).json(data);
    }
    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: data.expires_in * 1000,
    });
    if (data.refresh_token) {
      res.cookie('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    console.log('Token refresh successful:', {
      access_token: data.access_token.slice(0, 10) + '...',
      refresh_token: data.refresh_token ? data.refresh_token.slice(0, 10) + '...' : 'unchanged',
      expires_in: data.expires_in,
    });
    res.json({
      expires_in: data.expires_in,
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
    });
  } catch (err) {
    console.error('Refresh token error:', err.message, err.stack);
    res.status(500).json({ error: 'Refresh token failed' });
  }
});

app.post('/spotify/logout', (req, res) => {
  console.log('Logging out user');
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.json({ message: 'Logged out successfully' });
});

app.use('/', URouter);
const server = http.createServer(app);
initialization(server);

server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
