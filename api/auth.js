// API route for authentication endpoints
import { createServer } from 'http';
import express from 'express';

const app = express();
app.use(express.json());

// Basic auth endpoints
app.get('/user', (req, res) => {
  res.json({ message: 'Auth endpoint working' });
});

export default app;