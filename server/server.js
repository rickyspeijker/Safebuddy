const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buddyRequests', require('./routes/buddyRequests'));
app.use('/api/emergencyAlerts', require('./routes/emergencyAlerts'));
app.use('/api/safetyReports', require('./routes/safetyReports'));
// Proxy to external Base44 API
app.use('/api/external', require('./routes/base44Proxy'));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));