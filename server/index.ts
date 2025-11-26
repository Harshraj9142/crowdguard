import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow frontend to connect
        methods: ["GET", "POST"]
    }
});

interface LocationData {
    latitude: number;
    longitude: number;
    [key: string]: any;
}

interface UserData extends LocationData {
    id: string;
    lastUpdated: Date;
}

// Store connected users and their locations
const users: Record<string, UserData> = {};

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle location updates from a client
    socket.on('updateLocation', (data: LocationData) => {
        // data should contain { latitude, longitude, ... }
        users[socket.id] = { ...data, id: socket.id, lastUpdated: new Date() };

        // Broadcast updated location to all other clients
        socket.broadcast.emit('locationUpdate', users[socket.id]);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete users[socket.id];
        // Optionally notify others that a user left
        io.emit('userDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
