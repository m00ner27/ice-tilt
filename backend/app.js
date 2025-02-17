const cors = require('cors');
const statsRouter = require('./routes/stats');

app.use(cors({
  origin: 'http://localhost:4200', // Your Angular app URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/stats', statsRouter); 