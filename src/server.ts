import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import connectDB from './db';
import statsRouter from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:4200', // Your Angular app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/stats', statsRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.get('/api/test', async (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Start the server with error handling for port conflicts
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
    process.exit(1);
  } else {
    console.error('An unknown error occurred:', err);
    process.exit(1);
  }
}); 