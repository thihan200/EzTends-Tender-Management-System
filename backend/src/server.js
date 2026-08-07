const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const bidRoutes = require('./routes/bidRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend files locally
app.use(express.static(path.join(__dirname, '../../frontend')));

// Allow uploaded files to be opened
app.use(
    '/uploads',
    express.static(
        path.join(__dirname, '../uploads')
    )
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);

// Open login page as home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '127.0.0.1', () => {
    console.log(`EzTends server running at http://127.0.0.1:${PORT}`);
});