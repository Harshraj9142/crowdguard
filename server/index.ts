import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Incident from './models/Incident';
import User from './models/User';
import Comment from './models/Comment';
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
    .then(async () => {
        console.log('Connected to MongoDB');

        // Seed Users if empty
        try {
            const count = await User.countDocuments();
            if (count === 0) {
                console.log('Seeding initial users...');
                const mockUsers = [
                    {
                        id: 'u1',
                        name: 'Alex Chen',
                        rank: 1,
                        points: 2450,
                        badges: ['Guardian', 'First Responder', 'Top Reporter'],
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
                    },
                    {
                        id: 'u2',
                        name: 'Sarah Jones',
                        rank: 2,
                        points: 1980,
                        badges: ['Scout', 'Helper'],
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
                    },
                    {
                        id: 'u3',
                        name: 'Mike Ross',
                        rank: 3,
                        points: 1850,
                        badges: ['Watcher'],
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
                    }
                ];
                await User.insertMany(mockUsers);
                console.log('Seeding complete.');
            }
        } catch (err) {
            console.error('Seeding error:', err);
        }
    })
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

app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`;

        // Gemini Analysis
        let analysis = null;
        if (process.env.GEMINI_API_KEY) {
            try {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const imagePath = req.file.path;
                const imageData = fs.readFileSync(imagePath);
                const imageBase64 = imageData.toString('base64');

                const prompt = "Analyze this image. If it depicts a safety incident (theft, accident, fire, assault, suspicious activity, etc.), provide a short, factual description (max 2 sentences). If it does not appear to be a safety incident or is unclear, return 'Not a safety incident'.";

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: req.file.mimetype
                        }
                    }
                ]);
                const response = await result.response;
                analysis = response.text();
            } catch (geminiError) {
                console.error('Gemini analysis failed:', geminiError);
                analysis = "Verification unavailable";
            }
        }

        res.json({ imageUrl, analysis });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await User.find().sort({ points: -1 }).limit(10);
        // Assign ranks
        const rankedUsers = users.map((user, index) => ({
            ...user.toObject(),
            rank: index + 1
        }));
        res.json(rankedUsers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { id, name, avatar } = req.body;
        let user = await User.findOne({ id });
        if (!user) {
            user = new User({ id, name, avatar, points: 0, badges: ['Newcomer'] });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create/fetch user' });
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
