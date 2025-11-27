import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Incident from './models/Incident';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdguard';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

interface LocationData {
    id: string;
    latitude: number;
    longitude: number;
}

// Store connected users
const users: Record<string, LocationData> = {};

// API Routes
app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ timestamp: -1 });
        res.json(incidents);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

app.post('/api/incidents', async (req, res) => {
    try {
        const newIncident = new Incident(req.body);
        await newIncident.save();

        // Broadcast new incident to all connected clients
        io.emit('newIncident', newIncident);

        res.status(201).json(newIncident);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create incident' });
    }
});

app.post('/api/incidents/:id/upvote', async (req, res) => {
    try {
        const incident = await Incident.findOne({ id: req.params.id });
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }
        incident.upvotes += 1;
        if (incident.upvotes >= 5) {
            incident.verified = true;
        }
        await incident.save();
        io.emit('incidentUpdated', incident); // Re-emit to update clients
        res.json(incident);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upvote incident' });
    }
});

import Comment from './models/Comment';

app.get('/api/incidents/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ incidentId: req.params.id }).sort({ timestamp: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/incidents/:id/comments', async (req, res) => {
    try {
        const newComment = new Comment({
            ...req.body,
            incidentId: req.params.id
        });
        await newComment.save();
        io.emit('newComment', newComment);
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

import multer from 'multer';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send existing users to the new client
    socket.emit('currentUsers', users);

    // Handle location updates from a client
    socket.on('updateLocation', (data: LocationData) => {
        console.log(`Received location from ${socket.id}:`, data);
        // data should contain { latitude, longitude, ... }
        users[socket.id] = { ...data, id: socket.id };

        // Broadcast to all other clients
        socket.broadcast.emit('locationUpdate', { ...data, id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete users[socket.id];
        io.emit('userDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
