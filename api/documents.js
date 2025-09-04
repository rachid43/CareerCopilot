// API route for document endpoints
import express from 'express';

const app = express();
app.use(express.json());

// Basic documents endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Documents endpoint working', documents: [] });
});

export default app;