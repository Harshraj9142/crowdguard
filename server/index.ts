import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Incident from './models/Incident';

dotenv.config();

const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
}));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
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
