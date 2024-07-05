const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const WebSocket = require('ws');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Endpoint to update .env file
app.post('/update-env', (req, res) => {
  const envPath = path.resolve(__dirname, '.env');
  const newEnv = req.body;

  const envContent = Object.keys(newEnv)
    .map(key => `${key}=${newEnv[key]}`)
    .join('\n');

  fs.writeFile(envPath, envContent, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update .env file' });
    }
    res.json({ message: 'Successfully updated .env file' });
  });
});

// Endpoint to get .env file content
app.get('/env', (req, res) => {
  const envPath = path.resolve(__dirname, '.env');
  fs.readFile(envPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read .env file' });
    }
    const envVars = data.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      acc[key] = value;
      return acc;
    }, {});
    res.json(envVars);
  });
});

// Endpoint to handle login
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
    res.json({ message: 'Password correct' });
  } else {
    res.status(401).json({ message: 'Password incorrect' });
  }
});

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
  });
  ws.send('Hello from server');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
